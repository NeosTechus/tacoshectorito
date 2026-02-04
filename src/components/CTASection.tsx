import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import heroBg from '@/assets/hero-bg.jpg';

const CTASection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Taqueria Hectorito ambiance"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-warm-brown/90" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-warm-cream mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-warm-cream/80 text-lg mb-8 max-w-xl mx-auto">
            {t('cta.subtitle')}
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Button variant="hero" size="xl" asChild>
              <Link to="/menu" className="inline-flex items-center gap-2">
                {t('cta.orderNow')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="border-warm-cream/30 text-warm-cream hover:bg-warm-cream/10" asChild>
              <Link to="/contact">{t('cta.directions')}</Link>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-warm-cream/70">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>2753 Cherokee St, St. Louis</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-warm-cream/40" />
            <a href="tel:+13147718648" className="flex items-center gap-2 hover:text-warm-cream transition-colors">
              <Phone className="w-5 h-5" />
              <span>(314) 771-8648</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;