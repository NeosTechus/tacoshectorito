import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ChefHat, Package, Truck } from 'lucide-react';
import { API_BASE, ordersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import CreateAccountPrompt from '@/components/CreateAccountPrompt';
import { toast } from 'sonner';

interface Order {
  _id: string;
  status: string;
  items: Array<{ name: string; qty: number }>;
  totalAmount: number;
  estimatedReadyAt: string;
  prepTimeMinutes: number;
  createdAt: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
}

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const isTestMode = searchParams.get('test') === 'true';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canceling, setCanceling] = useState(false);
  const { isCartOpen, setIsCartOpen, clearCart } = useCart();

  // Clear cart on successful payment
  useEffect(() => {
    if (sessionId) {
      clearCart();
    }
  }, [sessionId, clearCart]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      let foundOrder = false;
      try {
        const result = await ordersApi.getBySessionId(sessionId);
        if (result.orders && result.orders.length > 0) {
          setOrder(result.orders[0]);
          const readyAt = new Date(result.orders[0].estimatedReadyAt).getTime();
          setTimeLeft(Math.max(0, readyAt - Date.now()));
          foundOrder = true;
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      }

      // Fall back to localStorage for test orders
      if (!foundOrder && (isTestMode || sessionId.startsWith('test_'))) {
        const testOrderData = localStorage.getItem(`test_order_${sessionId}`);
        if (testOrderData) {
          const testOrder = JSON.parse(testOrderData);
          setOrder(testOrder);
          const readyAt = new Date(testOrder.estimatedReadyAt).getTime();
          setTimeLeft(Math.max(0, readyAt - Date.now()));
        }
      }

      setLoading(false);
    };

    fetchOrder();
    if (sessionId) {
      const interval = setInterval(fetchOrder, 10000);
      return () => clearInterval(interval);
    }
  }, [sessionId, isTestMode]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const statusSteps = [
    { key: 'pending', label: 'Payment Received', icon: Clock },
    { key: 'received', label: 'Order Accepted', icon: CheckCircle },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready for Pickup', icon: Package },
    { key: 'completed', label: 'Completed', icon: Truck },
  ];

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return statusSteps.findIndex((s) => s.key === order.status);
  };

  const canCancel = (() => {
    if (!order || !sessionId) return false;
    if (!['pending', 'received'].includes(order.status)) return false;
    const createdAt = new Date(order.createdAt).getTime();
    return Date.now() - createdAt <= 2 * 60 * 1000;
  })();

  const handleCancelOrder = async () => {
    if (!sessionId || !order?.customerEmail) return;
    setCanceling(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          sessionId,
          customerEmail: order.customerEmail,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Cancel failed');
      }
      setOrder({ ...order, status: 'cancelled' });
      toast.success('Order cancelled and refunded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel order');
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 pt-24">
        {/* Test Mode Banner */}
        {(isTestMode || sessionId?.startsWith('test_')) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center"
          >
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              🧪 This is a test order - no real payment was processed
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>

          <h1 className="text-3xl font-bold mb-2">
            {order?.status === 'cancelled'
              ? 'Order Cancelled'
              : order?.status === 'pending'
                ? 'Payment Received!'
                : 'Order Confirmed!'}
          </h1>
          <p className="text-muted-foreground mb-2">
            {order?.status === 'cancelled'
              ? 'Your order was cancelled and a refund was initiated.'
              : order?.status === 'pending'
                ? 'Your payment was successful. Waiting for restaurant to accept your order.'
                : 'Thank you for your order. We\'re preparing your delicious food!'
            }
          </p>
          
          {order && (
            <div className="mb-8">
              <span className="text-sm text-muted-foreground">Order ID: </span>
              <span className="font-mono font-semibold text-foreground">
                {order._id.slice(-8).toUpperCase()}
              </span>
            </div>
          )}

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-48 mx-auto" />
              <div className="h-4 bg-muted rounded w-32 mx-auto" />
            </div>
          ) : order ? (
            <>
              {/* Pending Approval Notice */}
              {order.status === 'pending' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-8"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Awaiting Approval</span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    The restaurant will confirm your order shortly. You'll see the estimated time once accepted.
                  </p>
                </motion.div>
              )}

              {order.status === 'cancelled' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-8"
                >
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Your order has been cancelled. If you have questions, contact the restaurant.
                  </p>
                </motion.div>
              )}

              {/* Timer - only show when order is accepted and has estimated time */}
              {timeLeft > 0 && order.status !== 'pending' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-primary/10 rounded-2xl p-6 mb-8"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-primary">Estimated Ready Time</span>
                  </div>
                  <div className="text-4xl font-bold text-primary">{formatTime(timeLeft)}</div>
                </motion.div>
              )}

              {/* Status Progress */}
              {order.status !== 'cancelled' && (
                <div className="bg-card rounded-2xl p-6 mb-8 border">
                  <h3 className="font-semibold mb-4">Order Status</h3>
                  <div className="flex justify-between items-center">
                    {statusSteps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = index <= getCurrentStepIndex();
                      const isCurrent = index === getCurrentStepIndex();
                      
                      return (
                        <div key={step.key} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                              isActive
                                ? isCurrent
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-green-100 text-green-600'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-xs ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {canCancel && (
                <div className="mb-8">
                  <Button variant="destructive" onClick={handleCancelOrder} disabled={canceling}>
                    {canceling ? 'Cancelling...' : 'Cancel Order (refund)'}
                  </Button>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-card rounded-2xl p-6 border text-left">
                <h3 className="font-semibold mb-4">Order Summary</h3>
                <ul className="space-y-2 mb-4">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">x{item.qty}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t pt-4 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Create Account Prompt */}
              <CreateAccountPrompt 
                customerEmail={order.customerEmail}
                customerName={order.customerName}
                customerPhone={order.customerPhone}
              />
            </>
          ) : (
            <p className="text-muted-foreground">Order details not found.</p>
          )}

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link to="/orders">
              <Button variant="outline">View Order History</Button>
            </Link>
            <Link to="/menu">
              <Button>Order More</Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default OrderSuccessPage;
