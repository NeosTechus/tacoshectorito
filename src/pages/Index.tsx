import { CartProvider, useCart } from '@/contexts/CartContext';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import FeaturedSection from '@/components/FeaturedSection';
import HighlightsSection from '@/components/HighlightsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const IndexContent = () => {
  const { isCartOpen, setIsCartOpen } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      <main>
        <Hero />
        <HighlightsSection />
        <FeaturedSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

const Index = () => {
  return (
    <CartProvider>
      <IndexContent />
    </CartProvider>
  );
};

export default Index;
