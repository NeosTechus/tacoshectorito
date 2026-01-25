import { motion } from 'framer-motion';
import { UtensilsCrossed, Clock, Heart, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const HighlightsSection = () => {
  const { t } = useLanguage();

  const highlights = [
    {
      icon: UtensilsCrossed,
      title: t('highlights.recipes'),
      description: t('highlights.recipesDesc'),
    },
    {
      icon: Clock,
      title: t('highlights.fresh'),
      description: t('highlights.freshDesc'),
    },
    {
      icon: Heart,
      title: t('highlights.love'),
      description: t('highlights.loveDesc'),
    },
    {
      icon: Award,
      title: t('highlights.favorite'),
      description: t('highlights.favoriteDesc'),
    },
  ];

  return (
    <section id="highlights" className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {highlights.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center"
              >
                <item.icon className="w-8 h-8 text-primary" />
              </motion.div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HighlightsSection;