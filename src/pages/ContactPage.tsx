import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSEO } from '@/hooks/useSEO';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { toast } from 'sonner';

const ContactPageContent = () => {
  const { isCartOpen, setIsCartOpen } = useCart();
  const { t } = useLanguage();

  useSEO({
    title: 'Contact Us - Location & Hours',
    description: 'Visit Taqueria Hectorito at 2753 Cherokee St, St. Louis, MO 63118. Call (314) 771-8648. Open daily for lunch and dinner. Get directions and contact us.',
    canonical: 'https://eltoritostl.com/contact',
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const contactInfo = [
    {
      icon: MapPin,
      title: t('contact.address'),
      content: '2753 Cherokee St',
      subtitle: 'St. Louis, MO 63118',
      href: 'https://maps.google.com/?q=2753+Cherokee+St+St.+Louis+MO+63118',
    },
    {
      icon: Phone,
      title: t('contact.phone'),
      content: '(314) 771-8648',
      subtitle: '',
      href: 'tel:+13147718648',
    },
    {
      icon: Mail,
      title: t('contact.email'),
      content: 'eltorito.stl@gmail.com',
      subtitle: '',
      href: 'mailto:eltorito.stl@gmail.com',
    },
    {
      icon: Clock,
      title: t('contact.hours'),
      content: t('contact.hoursValue'),
      subtitle: t('contact.openUntil'),
      href: null,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      
      {/* Hero Section */}
      <section className="relative py-32 bg-gradient-to-br from-primary/10 via-background to-secondary/30 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 relative z-10 text-center"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm mb-4 block">
            {t('contact.heroSubtitle')}
          </span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            {t('contact.heroTitle')}
          </h1>
        </motion.div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 -mt-16 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-card p-6 rounded-2xl border border-border shadow-medium group"
              >
                {info.href ? (
                  <a href={info.href} target={info.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <info.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-card-foreground mb-1">
                      {info.title}
                    </h3>
                    <p className="text-foreground font-medium">{info.content}</p>
                    {info.subtitle && <p className="text-muted-foreground text-sm">{info.subtitle}</p>}
                  </a>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                      <info.icon className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-card-foreground mb-1">
                      {info.title}
                    </h3>
                    <p className="text-foreground font-medium">{info.content}</p>
                    <p className="text-accent font-medium text-sm">{info.subtitle}</p>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card p-8 md:p-10 rounded-3xl border border-border shadow-soft"
            >
              <h2 className="font-display text-3xl font-bold text-card-foreground mb-2">
                {t('contact.formTitle')}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t('contact.heroSubtitle')}
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      {t('contact.formName')}
                    </label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      {t('contact.phone')}
                    </label>
                    <Input
                      type="tel"
                      placeholder="(314) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t('contact.formEmail')}
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t('contact.formMessage')}
                  </label>
                  <Textarea
                    placeholder="..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="min-h-[150px] resize-none"
                  />
                </div>
                
                <Button type="submit" size="lg" className="w-full h-14 text-lg">
                  <Send className="w-5 h-5 mr-2" />
                  {t('contact.formSubmit')}
                </Button>
              </form>
            </motion.div>

            {/* Map & Social */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              {/* Map */}
              <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-soft">
                <div className="h-[400px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3117.5!2d-90.2!3d38.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDM2JzAwLjAiTiA5MMKwMTInMDAuMCJX!5e0!3m2!1sen!2sus!4v1600000000000!5m2!1sen!2sus"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Taqueria Hectorito Location"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold text-card-foreground mb-2">
                    {t('contact.visitTitle')}
                  </h3>
                  <p className="text-muted-foreground">
                    2753 Cherokee St, St. Louis, MO 63118
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-card p-8 rounded-3xl border border-border shadow-soft">
                <h3 className="font-display text-xl font-bold text-card-foreground mb-4">
                  Follow Us
                </h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="flex items-center gap-3 px-6 py-4 bg-secondary rounded-xl hover:bg-primary/10 transition-colors group flex-1"
                  >
                    <Facebook className="w-6 h-6 text-primary" />
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      Facebook
                    </span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 px-6 py-4 bg-secondary rounded-xl hover:bg-primary/10 transition-colors group flex-1"
                  >
                    <Instagram className="w-6 h-6 text-primary" />
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      Instagram
                    </span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

const ContactPage = () => {
  return (
    <CartProvider>
      <ContactPageContent />
    </CartProvider>
  );
};

export default ContactPage;