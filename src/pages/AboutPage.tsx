import { motion } from 'framer-motion';
import { Star, Heart, Users, Utensils, Award } from 'lucide-react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSEO } from '@/hooks/useSEO';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import heroImg from '@/assets/hero-bg.jpg';
import galleryInterior from '@/assets/gallery-interior.jpg';
import galleryTacos from '@/assets/gallery-tacos-platter.jpg';
import galleryKitchen from '@/assets/gallery-kitchen.jpg';
import gallerySalsa from '@/assets/gallery-salsa.jpg';
import foodQuesadilla from '@/assets/food-quesadilla.jpg';
import foodBurrito from '@/assets/food-burrito.jpg';
import foodTorta from '@/assets/food-torta.jpg';
import foodTacos from '@/assets/food-tacos.jpg';
import menuFeatured from '@/assets/menu-featured.jpg';

const AboutPageContent = () => {
  const { isCartOpen, setIsCartOpen } = useCart();
  const { t } = useLanguage();

  useSEO({
    title: 'About Us - Our Story & Values',
    description: 'Learn about El Torito\'s journey bringing authentic Mexican flavors to Cherokee Street, St. Louis since day one. Family recipes, fresh ingredients, community spirit.',
    canonical: 'https://eltoritostl.com/about',
  });

  const values = [
    {
      icon: Heart,
      title: t('about.value1Title'),
      description: t('about.value1Desc'),
    },
    {
      icon: Utensils,
      title: t('about.value2Title'),
      description: t('about.value2Desc'),
    },
    {
      icon: Users,
      title: t('about.value4Title'),
      description: t('about.value4Desc'),
    },
    {
      icon: Award,
      title: t('about.value3Title'),
      description: t('about.value3Desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImg} 
            alt="El Torito Restaurant" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm mb-4 block">
            {t('about.storyLabel')}
          </span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            {t('about.heroTitle')}
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
            {t('about.heroSubtitle')}
          </p>
        </motion.div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-primary font-semibold uppercase tracking-wider text-sm mb-4 block">
                {t('about.storyLabel')}
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                {t('about.storyTitle')}
              </h2>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                {t('about.storyP1')}
              </p>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                {t('about.storyP2')}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border inline-flex">
                <div className="flex items-center gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= 4 ? 'fill-current' : 'fill-current opacity-30'}`}
                    />
                  ))}
                </div>
                <div>
                  <span className="font-bold text-foreground">4.3</span>
                  <span className="text-muted-foreground"> (922 {t('hero.rating')})</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden shadow-xl">
                <img 
                  src={heroImg} 
                  alt="El Torito Interior" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-primary text-primary-foreground p-6 rounded-2xl shadow-lg">
                <p className="font-display text-4xl font-bold">Est.</p>
                <p className="text-lg opacity-90">Cherokee St.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-semibold uppercase tracking-wider text-sm mb-4 block">
              {t('about.valuesLabel')}
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('about.valuesTitle')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-card p-8 rounded-2xl border border-border shadow-soft text-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-card-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-semibold uppercase tracking-wider text-sm mb-4 block">
              {t('about.galleryLabel')}
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('about.galleryTitle')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { src: galleryInterior, alt: 'Restaurant Interior', span: 'md:col-span-2 md:row-span-2' },
              { src: galleryTacos, alt: 'Tacos Platter', span: '' },
              { src: foodQuesadilla, alt: 'Quesadilla', span: '' },
              { src: menuFeatured, alt: 'Our Menu Board', span: 'md:col-span-2' },
              { src: foodBurrito, alt: 'Burrito', span: '' },
              { src: gallerySalsa, alt: 'Fresh Salsa & Guacamole', span: '' },
              { src: foodTorta, alt: 'Torta', span: '' },
              { src: foodTacos, alt: 'Street Tacos', span: '' },
            ].map((image, index) => (
              <motion.div
                key={image.alt}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className={`relative overflow-hidden rounded-2xl cursor-pointer group ${image.span}`}
              >
                <div className={`aspect-square ${image.span.includes('row-span-2') ? 'md:aspect-auto md:h-full' : ''}`}>
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="font-display font-semibold">{image.alt}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              {t('about.ctaTitle')}
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              {t('about.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/menu" 
                className="px-8 py-4 bg-background text-foreground font-semibold rounded-xl hover:bg-background/90 transition-colors"
              >
                {t('about.viewMenu')}
              </a>
              <a 
                href="/contact" 
                className="px-8 py-4 bg-primary-foreground/10 border-2 border-primary-foreground font-semibold rounded-xl hover:bg-primary-foreground/20 transition-colors"
              >
                {t('about.contactUs')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

const AboutPage = () => {
  return (
    <CartProvider>
      <AboutPageContent />
    </CartProvider>
  );
};

export default AboutPage;