import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import CheckoutModal from './CheckoutModal';
import { useBusinessHours } from '@/hooks/useBusinessHours';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const businessHours = useBusinessHours();

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const drawerVariants = {
    hidden: { x: '100%' },
    visible: { x: 0 },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20, height: 0 },
  };

  return (
    <>
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
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
            />

            {/* Drawer */}
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-strong z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">Your Cart</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">
                      Your cart is empty
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Add some delicious items from our menu!
                    </p>
                    <Button variant="default" onClick={onClose}>
                      Continue Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          className="bg-card rounded-xl p-4 border border-border"
                        >
                          <div className="flex gap-4">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <h4 className="font-semibold text-card-foreground">{item.name}</h4>
                                  {/* Customization details */}
                                  <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                                    {item.sauce && item.sauce !== 'No Sauce' && (
                                      <p>🌶️ {item.sauce}</p>
                                    )}
                                    {item.toppings && item.toppings.length > 0 && (
                                      <p>🥬 {item.toppings.join(', ')}</p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 bg-secondary rounded-lg">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="p-2 hover:text-primary transition-colors"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-8 text-center font-semibold text-foreground">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="p-2 hover:text-primary transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                <span className="font-bold text-foreground">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Clear cart button */}
                    <button
                      onClick={clearCart}
                      className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear all items
                    </button>
                  </div>
                )}
              </div>

              {/* Footer with total and checkout */}
              {items.length > 0 && (
                <div className="border-t border-border p-6 space-y-4">
                  {/* Closed Warning */}
                  {!businessHours.isOpen && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          We're Currently Closed
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          We open {businessHours.nextOpenTime}. You can browse our menu, but ordering is unavailable until we're open.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Closing Soon Warning */}
                  {businessHours.isOpen && businessHours.minutesUntilClose && businessHours.minutesUntilClose <= 30 && (
                    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        Closing soon! We close at {businessHours.closesAt} ({businessHours.minutesUntilClose} min left)
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold text-foreground">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tax (estimated)</span>
                    <span className="font-semibold text-foreground">
                      ${(totalPrice * 0.0875).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg border-t border-border pt-4">
                    <span className="font-display font-bold text-foreground">Total</span>
                    <span className="font-display font-bold text-primary text-2xl">
                      ${(totalPrice * 1.0875).toFixed(2)}
                    </span>
                  </div>
                  
                  {businessHours.isOpen ? (
                    <Button
                      variant="hero"
                      size="xl"
                      className="w-full"
                      onClick={() => setIsCheckoutOpen(true)}
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="xl"
                      className="w-full"
                      disabled
                    >
                      <Clock className="w-5 h-5 mr-2" />
                      Ordering Opens {businessHours.opensAt}
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </>
  );
};

export default CartDrawer;
