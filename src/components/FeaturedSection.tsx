import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import foodTacos from '@/assets/food-tacos.jpg';
import foodBurrito from '@/assets/food-burrito.jpg';
import foodQuesadilla from '@/assets/food-quesadilla.jpg';
import foodTorta from '@/assets/food-torta.jpg';

const FeaturedSection = () => {
  const { t } = useLanguage();

  const featuredItems = [
    {
      name: t('featured.tacos'),
      description: t('featured.tacosDesc'),
      price: '$3.85',
      image: foodTacos,
      popular: true,
    },
    {
      name: t('featured.burrito'),
      description: t('featured.burritoDesc'),
      price: '$15',
      image: foodBurrito,
      popular: false,
    },
    {
      name: t('featured.quesadilla'),
      description: t('featured.quesadillaDesc'),
      price: '$12',
      image: foodQuesadilla,
      popular: true,
    },
    {
      name: t('featured.torta'),
      description: t('featured.tortaDesc'),
      price: '$12',
      image: foodTorta,
      popular: false,
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm mb-4 block">
            {t('featured.label')}
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('featured.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('featured.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featuredItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {item.popular && (
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {t('featured.popular')}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display text-xl font-bold text-card-foreground">
                    {item.name}
                  </h3>
                  <span className="text-primary font-bold">{item.price}</span>
                </div>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button variant="default" size="lg" asChild>
            <Link to="/menu" className="inline-flex items-center gap-2">
              {t('featured.viewMenu')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedSection;