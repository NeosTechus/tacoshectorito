import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Loader2, ShieldCheck, Lock, FlaskConical, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/lib/api';
import { useBusinessHours } from '@/hooks/useBusinessHours';
import { toast } from 'sonner';
import { z } from 'zod';

const API_URL = API_BASE;
const HAS_STRIPE_KEYS = Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Validation schema
const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().trim().email('Please enter a valid email'),
  phone: z.string().trim().min(10, 'Please enter a valid phone number').max(20, 'Phone number too long'),
});

const CheckoutModal = ({ isOpen, onClose }: CheckoutModalProps) => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { guestId } = useAuth();
  const businessHours = useBusinessHours();
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(!HAS_STRIPE_KEYS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const validateForm = () => {
    try {
      checkoutSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if restaurant is open
    if (!businessHours.isOpen) {
      toast.error(`We're currently closed. We open ${businessHours.nextOpenTime}`);
      return;
    }
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    // Test mode - simulate successful checkout
    if (testMode) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing

      let testSessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let testOrderId: string | null = null;

      try {
        const response = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Dev-Order': 'true',
          },
          body: JSON.stringify({
            items: items.map(item => ({
              name: item.name,
              qty: item.quantity,
              price: item.price,
              meatType: item.meatType,
              sauce: item.sauce,
              toppings: item.toppings,
            })),
            customerEmail: formData.email.trim(),
            customerName: formData.name.trim(),
            customerPhone: formData.phone.trim(),
            guestId,
            totalAmount: totalPrice * 1.0875,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.stripeSessionId) {
            testSessionId = data.stripeSessionId;
          }
          if (data?.orderId) {
            testOrderId = data.orderId;
          }
        }
      } catch (error) {
        console.warn('Dev order save failed, falling back to local test order:', error);
      }

      // Store test order data in localStorage for the success page
      const testOrder = {
        _id: testOrderId || testSessionId,
        stripeSessionId: testSessionId,
        customerEmail: formData.email.trim(),
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        items: items.map(item => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
          meatType: item.meatType || null,
          sauce: item.sauce || null,
          toppings: item.toppings || null,
        })),
        totalAmount: totalPrice * 1.0875,
        status: 'pending', // Payment received, awaiting admin approval
        prepTimeMinutes: 15,
        createdAt: new Date().toISOString(),
        estimatedReadyAt: null, // Will be set when admin accepts
      };
      localStorage.setItem(`test_order_${testSessionId}`, JSON.stringify(testOrder));

      clearCart();
      toast.success('🧪 Test order created successfully!');
      onClose();
      navigate(`/order-success?session_id=${testSessionId}&test=true`);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            meatType: item.meatType,
            sauce: item.sauce,
          })),
          customerEmail: formData.email.trim(),
          customerName: formData.name.trim(),
          customerPhone: formData.phone.trim(),
          guestId,
        }),
      });

      // Handle 404 - API not available, offer test mode
      if (response.status === 404) {
        setLoading(false);
        setTestMode(true);
        toast.error('Payment API not available. Test mode enabled.');
        return;
      }

      // Handle empty response
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server. Please check API configuration.');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  const tax = totalPrice * 0.0875;
  const total = totalPrice + tax;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-[65]"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-4 bottom-4 left-4 right-4 md:top-8 md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-background rounded-2xl shadow-strong z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-primary" />
                <h2 className="font-display text-2xl font-bold text-foreground">Checkout</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order summary */}
                <div className="bg-secondary/50 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {item.name} x{item.quantity}
                          {item.meatType && <span className="text-xs"> ({item.meatType})</span>}
                        </span>
                        <span className="text-foreground font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-3 mt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (8.75%)</span>
                      <span className="text-foreground">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Contact Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={errors.name ? 'border-destructive' : ''}
                      disabled={loading || !businessHours.isOpen}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={errors.email ? 'border-destructive' : ''}
                        disabled={loading || !businessHours.isOpen}
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={errors.phone ? 'border-destructive' : ''}
                        disabled={loading || !businessHours.isOpen}
                      />
                      {errors.phone && (
                        <p className="text-xs text-destructive">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Closed Warning */}
                {!businessHours.isOpen && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Restaurant Closed</p>
                      <p className="text-xs text-destructive/80 mt-1">
                        We're currently closed. Online ordering opens {businessHours.nextOpenTime}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Test Mode / Stripe Security Badge */}
                {testMode ? (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
                    <FlaskConical className="w-8 h-8 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Test Mode Active</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        No real payment will be processed. Order will be simulated.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-accent flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Secure Payment</p>
                      <p className="text-xs text-muted-foreground">
                        You'll be redirected to Stripe's secure payment page
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full" 
                  type="submit"
                  disabled={loading || items.length === 0 || !businessHours.isOpen}
                >
                  {!businessHours.isOpen ? (
                    <>
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Opens {businessHours.opensAt}
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {testMode ? 'Processing Test Order...' : 'Redirecting to Payment...'}
                    </>
                  ) : testMode ? (
                    <>
                      <FlaskConical className="w-5 h-5 mr-2" />
                      Place Test Order (${total.toFixed(2)})
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pay ${total.toFixed(2)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {!businessHours.isOpen
                    ? `Hours: ${businessHours.opensAt} - ${businessHours.closesAt}`
                    : testMode 
                      ? 'Test mode - no real charges. Deploy to Vercel for live payments.'
                      : 'By proceeding, you agree to our terms of service'
                  }
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;
