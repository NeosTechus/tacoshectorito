import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Truck,
  ShoppingBag,
  ArrowRight,
  Search,
  Calendar,
  Receipt,
  LogIn,
  User,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApi } from '@/lib/api';
import { useCart, CartItem } from '@/contexts/CartContext';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

interface OrderItem {
  name: string;
  qty: number;
  price?: number;
  meatType?: string;
  sauce?: string;
  toppings?: string[];
  image?: string;
}

interface Order {
  _id: string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  estimatedReadyAt?: string;
}

const OrderHistoryPage = () => {
  const { user, guestId } = useAuth();
  const { isCartOpen, setIsCartOpen, addMultipleToCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  // Load test orders from localStorage
  const getTestOrders = (): Order[] => {
    const testOrders: Order[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('test_order_')) {
        try {
          const order = JSON.parse(localStorage.getItem(key) || '');
          testOrders.push(order);
        } catch (e) {
          // Ignore invalid entries
        }
      }
    }
    return testOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const fetchOrders = async (email?: string) => {
    setLoading(true);
    
    // Always include test orders
    const testOrders = getTestOrders();
    
    try {
      let apiOrders: Order[] = [];
      
      if (email) {
        const result = await ordersApi.getByEmail(email);
        apiOrders = result.orders || [];
      } else if (user?.email) {
        const result = await ordersApi.getByEmail(user.email);
        apiOrders = result.orders || [];
      } else if (guestId) {
        const result = await ordersApi.getByGuestId(guestId);
        apiOrders = result.orders || [];
      }
      
      // Combine and dedupe orders
      const allOrders = [...testOrders, ...apiOrders];
      const uniqueOrders = allOrders.filter((order, index, self) =>
        index === self.findIndex((o) => o._id === order._id)
      );
      
      setOrders(uniqueOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Still show test orders even if API fails
      setOrders(testOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, guestId]);

  const handleEmailSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchEmail.trim()) {
      await fetchOrders(searchEmail.trim());
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received': return <Clock className="w-4 h-4" />;
      case 'preparing': return <ChefHat className="w-4 h-4" />;
      case 'ready': return <Package className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'preparing': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'ready': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'completed': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Reorder: add all items from a past order to the cart
  const handleReorder = (order: Order) => {
    // Estimate per-item price from total if not stored
    const estimatedItemPrice = order.items.length > 0 
      ? order.totalAmount / order.items.reduce((sum, item) => sum + item.qty, 0)
      : 10;

    const cartItems: Array<Omit<CartItem, 'quantity'> & { quantity: number }> = order.items.map((item, index) => ({
      id: `reorder-${order._id}-${index}-${Date.now()}`,
      name: item.name,
      price: item.price || estimatedItemPrice,
      quantity: item.qty,
      image: item.image || '/placeholder.svg',
      category: 'restaurant' as const,
      meatType: item.meatType,
      sauce: item.sauce,
      toppings: item.toppings,
    }));

    addMultipleToCart(cartItems);
    toast.success('Items added to cart!', {
      description: `${order.items.reduce((sum, i) => sum + i.qty, 0)} items from your previous order`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      
      <main className="container mx-auto px-4 py-12 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Receipt className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Order History
            </h1>
            <p className="text-muted-foreground">
              View and track all your past orders
            </p>
          </div>

          {/* User Status & Login Prompt */}
          {user ? (
            <Card className="mb-8 bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">Showing orders for your account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {/* Login Card */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LogIn className="w-5 h-5 text-primary" />
                    Have an Account?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to see all your orders and enjoy faster checkout
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/login">
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Search by Email Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Find Orders by Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEmailSearch} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" variant="outline" disabled={loading}>
                      Search
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No orders yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  When you place orders, they'll appear here
                </p>
                <Button asChild>
                  <Link to="/menu">
                    Browse Menu
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-medium transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Order Info */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm text-muted-foreground">
                                  #{order._id.slice(-8)}
                                </span>
                                {order._id.startsWith('test_') && (
                                  <Badge variant="outline" className="text-xs">
                                    Test
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {formatDate(order.createdAt)}
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(order.status)} gap-1`}>
                              {getStatusIcon(order.status)}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>

                          {/* Items */}
                          <div className="space-y-1 mb-4">
                            {order.items.map((item, i) => (
                              <p key={i} className="text-sm text-foreground">
                                {item.qty}x {item.name}
                              </p>
                            ))}
                          </div>

                          {/* Total & Actions */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-lg font-bold text-primary">
                              ${order.totalAmount.toFixed(2)}
                            </span>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleReorder(order)}
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Reorder
                              </Button>
                              {order.status !== 'completed' && (
                                <Button asChild size="sm" variant="outline">
                                  <Link to={`/order-success?session_id=${order._id}${order._id.startsWith('test_') ? '&test=true' : ''}`}>
                                    Track
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Timeline (Desktop) */}
                        <div className="hidden md:flex flex-col justify-center bg-muted/30 p-6 w-48">
                          <div className="space-y-3">
                            {['received', 'preparing', 'ready', 'completed'].map((status, i) => {
                              const isActive = ['received', 'preparing', 'ready', 'completed']
                                .indexOf(order.status) >= i;
                              return (
                                <div key={status} className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    isActive ? 'bg-primary' : 'bg-border'
                                  }`} />
                                  <span className={`text-xs ${
                                    isActive ? 'text-foreground' : 'text-muted-foreground'
                                  }`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Back to Menu */}
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link to="/menu">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Order More
              </Link>
            </Button>
          </div>
        </motion.div>
      </main>

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default OrderHistoryPage;
