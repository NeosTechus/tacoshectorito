import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChefHat, Package, CheckCircle, Search, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ordersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

interface Order {
  _id: string;
  status: string;
  items: Array<{ name: string; qty: number }>;
  totalAmount: number;
  estimatedReadyAt: string;
  prepTimeMinutes: number;
  createdAt: string;
  customerName?: string;
}

const OrderTrackingPage = () => {
  const { guestId, user, isGuest, isAuthenticated } = useAuth();
  const { isCartOpen, setIsCartOpen } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  const fetchOrders = async (email?: string) => {
    setLoading(true);
    try {
      let result;
      if (email) {
        result = await ordersApi.getByEmail(email);
      } else if (user?.email) {
        result = await ordersApi.getByEmail(user.email);
      } else if (guestId) {
        result = await ordersApi.getByGuestId(guestId);
      } else {
        setLoading(false);
        return;
      }

      if (result.orders) {
        setOrders(result.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (guestId || user?.email) {
      fetchOrders();
    } else {
      setLoading(false);
    }

    // Refresh every 30 seconds for live updates
    const interval = setInterval(() => {
      if (guestId || user?.email) {
        fetchOrders();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [guestId, user?.email]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchEmail) {
      fetchOrders(searchEmail);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <CheckCircle className="w-5 h-5" />;
      case 'preparing':
        return <ChefHat className="w-5 h-5" />;
      case 'ready':
        return <Package className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-blue-100 text-blue-700';
      case 'preparing':
        return 'bg-orange-100 text-orange-700';
      case 'ready':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTimeRemaining = (estimatedReadyAt: string) => {
    const remaining = new Date(estimatedReadyAt).getTime() - Date.now();
    if (remaining <= 0) return 'Ready!';
    const minutes = Math.floor(remaining / 60000);
    return `${minutes} min`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-2 text-center">Order Tracking</h1>
          <p className="text-muted-foreground text-center mb-8">
            Track your orders in real-time
          </p>

          {/* Auth Status */}
          <div className="bg-card border rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                {isAuthenticated ? (
                  <>
                    <p className="font-medium">{user?.name || user?.email}</p>
                    <p className="text-sm text-muted-foreground">Signed in</p>
                  </>
                ) : isGuest ? (
                  <>
                    <p className="font-medium">Guest Session</p>
                    <p className="text-sm text-muted-foreground">Create an account to save order history</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No active session</p>
                )}
              </div>
            </div>
          </div>

          {/* Search by Email */}
          {!isAuthenticated && (
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => setSearchMode(!searchMode)}
                className="mb-4"
              >
                <Search className="w-4 h-4 mr-2" />
                Search by Email
              </Button>

              {searchMode && (
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit">Search</Button>
                </form>
              )}
            </div>
          )}

          {/* Orders List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-muted rounded-xl h-32" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        #{order._id.slice(-8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {order.status !== 'completed' && (
                        <div className="flex items-center gap-2 text-primary">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{getTimeRemaining(order.estimatedReadyAt)}</span>
                        </div>
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-1 mb-4">
                    {order.items.map((item, index) => (
                      <li key={index} className="text-sm flex justify-between">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">x{item.qty}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${order.totalAmount.toFixed(2)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border rounded-xl">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No orders found</p>
              <Button className="mt-4" asChild>
                <a href="/menu">Order Now</a>
              </Button>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default OrderTrackingPage;
