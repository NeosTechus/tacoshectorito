import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  const quickLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.menu'), href: '/menu' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  const popularItems = [
    { name: t('menu.tacos'), href: '/menu' },
    { name: t('menu.burrito'), href: '/menu' },
    { name: t('menu.quesadilla'), href: '/menu' },
    { name: t('menu.torta'), href: '/menu' },
  ];

  return (
    <footer className="bg-warm-brown text-warm-cream py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path
                    d="M10 90 Q 50 10 90 90"
                    fill="none"
                    stroke="hsl(0 72% 51%)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 90 Q 50 25 80 90"
                    fill="none"
                    stroke="hsl(145 55% 35%)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <ellipse cx="50" cy="65" rx="20" ry="12" fill="hsl(35 30% 95%)" />
                  <circle cx="35" cy="55" r="8" fill="hsl(35 30% 95%)" />
                </svg>
              </div>
              <span className="font-display text-2xl font-bold">Taqueria Hectorito</span>
            </div>
            <p className="text-warm-cream/70 mb-6">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-warm-cream/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-warm-cream/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="font-display text-lg font-bold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-warm-cream/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="font-display text-lg font-bold mb-4">{t('footer.popularItems')}</h4>
            <ul className="space-y-3">
              {popularItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-warm-cream/70 hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="font-display text-lg font-bold mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-warm-cream/70">
                  2753 Cherokee St<br />
                  St. Louis, MO 63118
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a href="tel:+13147718648" className="text-warm-cream/70 hover:text-primary transition-colors">
                  (314) 771-8648
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href="mailto:eltorito.stl@gmail.com" className="text-warm-cream/70 hover:text-primary transition-colors text-sm">
                  eltorito.stl@gmail.com
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-warm-cream/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-warm-cream/50 text-sm">
              © {currentYear} Taqueria Hectorito Restaurante. {t('footer.rights')}
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/privacy-policy"
                className="text-warm-cream/50 hover:text-warm-cream/70 text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-warm-cream/50 hover:text-warm-cream/70 text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/admin/login"
                className="text-warm-cream/30 hover:text-warm-cream/50 text-xs transition-colors"
              >
                Admin Login
              </Link>
              <Link
                to="/chef/login"
                className="text-warm-cream/30 hover:text-warm-cream/50 text-xs transition-colors"
              >
                Chef Login
              </Link>
              <a
                href="https://www.neostechus.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-warm-cream/50 hover:text-warm-cream/70 text-sm transition-colors"
              >
                <img src="/logo.png" alt="NeosTech" className="h-5 w-5 rounded-sm" />
                Proud client of NeosTech
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;