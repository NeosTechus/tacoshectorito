import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

import quesadillaImg from '@/assets/food-quesadilla.jpg';
import tortaImg from '@/assets/food-torta.jpg';
import tacosImg from '@/assets/food-tacos.jpg';
import burritoImg from '@/assets/food-burrito.jpg';
import drinkWaterImg from '@/assets/drink-water.jpg';
import drinkCocaImg from '@/assets/drink-coca.jpg';
import drinkJarritosImg from '@/assets/drink-jarritos.jpg';


const menuItems = [
  {
    id: 'quesadilla',
    name: 'Quesadilla',
    description: 'A 12" tortilla filled primarily with cheese, your choice of meat, and fresh toppings like cilantro, onion, cucumber, radish.',
    price: 12,
    image: quesadillaImg,
    isNew: false,
    isPopular: true,
  },
  {
    id: 'torta',
    name: 'Torta',
    description: 'A large Mexican sandwich filled with your choice of meat. Finished off with mayo, cheese, lettuce, tomato, onion, jalapeños, avocado.',
    price: 12,
    image: tortaImg,
    isNew: false,
    isPopular: false,
  },
  {
    id: 'torta-del-chavo',
    name: 'Torta Del Chavo',
    description: 'A large Mexican sandwich loaded with pork ham and pork cheese. Finished off with mayo, cheese, lettuce, tomato, onion, jalapeños, avocado.',
    price: 12,
    image: tortaImg,
    isNew: true,
    isPopular: false,
  },
  {
    id: 'quesadilla-huasteca',
    name: 'Quesadilla Wuasteca',
    description: 'A traditional Huasteca-style quesadilla with your choice of meat, melted cheese, and fresh toppings.',
    price: 11,
    image: quesadillaImg,
    isNew: true,
    isPopular: false,
  },
  {
    id: 'burrito',
    name: 'Burrito',
    description: '12" white flour tortilla served with your choice of meat, topped with our fresh cilantro, onion, cucumber, fresh radish and cheese.',
    price: 12,
    image: burritoImg,
    isNew: false,
    isPopular: true,
  },
  {
    id: 'tacos',
    name: 'Tacos',
    description: '2 small hand-sized white corn tortilla filled with your choice of meat and topped with your choice of fresh toppings.',
    price: 4,
    image: tacosImg,
    isNew: false,
    isPopular: true,
    priceLabel: 'each',
  },
];

const meatTypes = [
  'Carne Asada', 'Pollo', 'Al Pastor', 
  'Campechano', 'Chorizo', 'Carnitas',
  'Barbacoa', 'Chicharron Prensado',
  'Tripas (+$1)', 'Lengua (+$1)'
];

const toppingTypes = [
  'Cilantro', 'Onion', 'Cucumber', 'Radish', 'Lime'
];

const burritoToppingTypes = [
  'Cilantro', 'Onion', 'Cucumber', 'Radish', 'Lime', 'Cheese'
];

const tacosToppingTypes = [
  'Cilantro', 'Onion', 'Cucumber', 'Radish', 'Lime', 'Cheese'
];

const tortaToppingTypes = [
  'Cilantro', 'Onion', 'Cucumber', 'Radish', 'Lime', 'Jalapeño', 'Avocado'
];

const sauceTypes = [
  'No Sauce', 'Salsa Verde', 'Salsa Roja', 'Salsa Verde & Roja'
];

// Items that support topping selection
const itemsWithToppings = ['quesadilla', 'quesadilla-huasteca', 'burrito', 'tacos', 'torta', 'torta-del-chavo'];

const MenuSection = () => {
  const { addToCart } = useCart();
  const [selectedMeat, setSelectedMeat] = useState<Record<string, string>>({});
  const [selectedSauce, setSelectedSauce] = useState<Record<string, string>>({});
  const [selectedToppings, setSelectedToppings] = useState<Record<string, string[]>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const [drinkQuantities, setDrinkQuantities] = useState<Record<string, number>>({});

  const getDrinkQuantity = (drinkName: string) => drinkQuantities[drinkName] || 1;
  
  const updateDrinkQuantity = (drinkName: string, delta: number) => {
    setDrinkQuantities((prev) => {
      const current = prev[drinkName] || 1;
      const newQty = Math.max(1, Math.min(10, current + delta));
      return { ...prev, [drinkName]: newQty };
    });
  };

  const handleToppingToggle = (itemId: string, topping: string) => {
    setSelectedToppings((prev) => {
      const currentToppings = prev[itemId] || [];
      if (currentToppings.includes(topping)) {
        return { ...prev, [itemId]: currentToppings.filter((t) => t !== topping) };
      } else {
        return { ...prev, [itemId]: [...currentToppings, topping] };
      }
    });
  };

  const handleAddToCart = (item: typeof menuItems[0]) => {
    const meat = selectedMeat[item.id] || 'Carne Asada';
    const sauce = selectedSauce[item.id] || 'No Sauce';
    const toppings = selectedToppings[item.id] || [];
    const priceAdjustment = meat.includes('+$1') ? 1 : 0;
    
    const toppingsStr = toppings.length > 0 ? toppings.join(', ') : 'No toppings';
    const itemId = itemsWithToppings.includes(item.id)
      ? `${item.id}-${meat}-${sauce}-${toppings.sort().join('-')}`
      : `${item.id}-${meat}-${sauce}`;
    
    const itemName = `${item.name} (${meat.replace(' (+$1)', '')})`;
    
    addToCart({
      id: itemId,
      name: itemName,
      price: item.price + priceAdjustment,
      image: item.image,
      category: 'restaurant',
      meatType: meat,
      sauce: sauce,
      toppings: itemsWithToppings.includes(item.id) ? toppings : undefined,
    });

    const description = itemsWithToppings.includes(item.id)
      ? `With ${meat.replace(' (+$1)', '')} • ${sauce} • ${toppingsStr}`
      : `With ${meat.replace(' (+$1)', '')} • ${sauce}`;

    toast.success(`Added ${item.name} to cart!`, {
      description,
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section id="menu" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Featured Menu Image */}

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm mb-4 block">
            Restaurante
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Our Menu
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Authentic Mexican flavors made fresh daily. Choose your favorite meat and toppings.
          </p>
        </motion.div>

        {/* Meat selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h3 className="font-display text-2xl font-bold text-center mb-6 text-foreground">
            <span className="text-primary">Our</span> Meats
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {meatTypes.map((meat) => (
              <span
                key={meat}
                className="px-4 py-2 bg-card rounded-full text-sm font-medium text-card-foreground border border-border hover:border-primary hover:text-primary transition-colors cursor-default"
              >
                {meat}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Menu grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {menuItems.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className="group relative bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <motion.img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  animate={{
                    scale: hoveredItem === item.id ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {item.isNew && (
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      NEW
                    </span>
                  )}
                  {item.isPopular && (
                    <span className="bg-mexican-red text-primary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      POPULAR
                    </span>
                  )}
                </div>

                {/* Price tag */}
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="font-bold text-foreground text-2xl">${item.price}</span>
                  {item.priceLabel && (
                    <span className="text-muted-foreground text-base ml-1">{item.priceLabel}</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-display text-2xl font-bold text-card-foreground mb-2">
                  {item.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>

                {/* Meat selector */}
                <div className="mb-3">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Choose your meat:
                  </label>
                  <select
                    value={selectedMeat[item.id] || 'Carne Asada'}
                    onChange={(e) => setSelectedMeat({ ...selectedMeat, [item.id]: e.target.value })}
                    className="w-full px-4 py-2 bg-secondary rounded-lg border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {meatTypes.map((meat) => (
                      <option key={meat} value={meat}>
                        {meat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sauce selector */}
                <div className="mb-3">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Choose your sauce:
                  </label>
                  <select
                    value={selectedSauce[item.id] || 'No Sauce'}
                    onChange={(e) => setSelectedSauce({ ...selectedSauce, [item.id]: e.target.value })}
                    className="w-full px-4 py-2 bg-secondary rounded-lg border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {sauceTypes.map((sauce) => (
                      <option key={sauce} value={sauce}>
                        {sauce}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toppings selector - only for quesadilla, burrito, tacos */}
                {itemsWithToppings.includes(item.id) && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Choose your toppings:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(item.id === 'burrito' ? burritoToppingTypes : item.id === 'tacos' ? tacosToppingTypes : item.id === 'torta' ? tortaToppingTypes : toppingTypes).map((topping) => {
                        const isSelected = (selectedToppings[item.id] || []).includes(topping);
                        return (
                          <button
                            key={topping}
                            onClick={() => handleToppingToggle(item.id, topping)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-foreground border border-border hover:border-primary'
                            }`}
                          >
                            {topping}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add to cart button */}
                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={() => handleAddToCart(item)}
                >
                  <Plus className="w-5 h-5" />
                  Add to Cart
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Non-Alcoholic Drinks section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16"
        >
          <h3 className="font-display text-3xl font-bold text-center mb-8 text-foreground">
            <span className="text-primary">Bebidas</span> (Drinks)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { name: 'Water Bottle 16oz', price: 3, image: drinkWaterImg },
              { name: 'Coca medio Litro', price: 4, image: drinkCocaImg },
              { name: 'Jarritos', price: 3, image: drinkJarritosImg },
            ].map((drink) => {
              const quantity = getDrinkQuantity(drink.name);
              const isSelected = selectedDrink === drink.name;
              return (
                <motion.div
                  key={drink.name}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-card rounded-xl border overflow-hidden transition-colors ${
                    isSelected ? 'border-primary' : 'border-border hover:border-primary'
                  }`}
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => setSelectedDrink(isSelected ? null : drink.name)}
                  >
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={drink.image} 
                        alt={drink.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-card-foreground">{drink.name}</span>
                      <span className="text-primary font-bold text-xl">${drink.price}</span>
                    </div>
                  </div>
                  
                  <div className="px-3 pb-3 flex flex-col gap-3">
                    
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-3 overflow-hidden"
                        >
                          {/* Quantity selector */}
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateDrinkQuantity(drink.name, -1)}
                              disabled={quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateDrinkQuantity(drink.name, 1)}
                              disabled={quantity >= 10}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const qty = isSelected ? quantity : 1;
                        for (let i = 0; i < qty; i++) {
                          addToCart({
                            id: drink.name.toLowerCase().replace(/\s/g, '-'),
                            name: drink.name,
                            price: drink.price,
                            image: drink.image,
                            category: 'restaurant',
                          });
                        }
                        toast.success(`Added ${qty > 1 ? qty + 'x ' : ''}${drink.name} to cart!`);
                        setDrinkQuantities((prev) => ({ ...prev, [drink.name]: 1 }));
                        setSelectedDrink(null);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add {isSelected && quantity > 1 ? `${quantity}x ` : ''}to Cart
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Alcoholic Drinks section - In-Store Only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12"
        >
          <h3 className="font-display text-3xl font-bold text-center mb-2 text-foreground">
            <span className="text-primary">Cervezas</span> (Beer)
          </h3>
          <p className="text-center text-muted-foreground text-sm mb-8">
            🍺 In-Store Only • Sólo en el Local
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { name: 'Cerveza de Botella', price: 5 },
              { name: 'Modelo Michelada', price: 8 },
              { name: 'Cawama Corona', price: 9 },
            ].map((drink) => (
              <motion.div
                key={drink.name}
                whileHover={{ scale: 1.02 }}
                className="bg-card/50 p-4 rounded-xl border border-border/50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-card-foreground">{drink.name}</span>
                  <span className="text-muted-foreground font-bold">${drink.price}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MenuSection;
