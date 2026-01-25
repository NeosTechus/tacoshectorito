import { CartProvider, useCart } from '@/contexts/CartContext';
import { useSEO } from '@/hooks/useSEO';
import Navbar from '@/components/Navbar';
import MenuSection from '@/components/MenuSection';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const MenuPageContent = () => {
  const { isCartOpen, setIsCartOpen } = useCart();
  
  useSEO({
    title: 'Menu - Tacos, Burritos & More',
    description: 'Explore our authentic Mexican menu featuring tacos, burritos, quesadillas, tortas, and refreshing drinks. Fresh ingredients, traditional recipes.',
    canonical: 'https://eltoritostl.com/menu',
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      <main className="pt-8">
        <MenuSection />
      </main>
      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

const MenuPage = () => {
  return (
    <CartProvider>
      <MenuPageContent />
    </CartProvider>
  );
};

export default MenuPage;
