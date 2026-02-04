import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.menu': 'Menu',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.cart': 'Cart',
    'nav.tagline': 'Mexican Restaurant',
    'nav.open': 'Open',
    'nav.closes': 'Closes 8 PM',
    
    // Hero
    'hero.rating': 'reviews',
    'hero.subtitle': 'Restaurante Mexicano',
    'hero.description': 'Authentic Mexican tacos on historic Cherokee Street. From sizzling tacos to homemade tortillas, experience the flavors of Mexico.',
    'hero.viewMenu': 'View Menu',
    
    // Highlights Section
    'highlights.recipes': 'Authentic Recipes',
    'highlights.recipesDesc': 'Traditional family recipes passed down through generations',
    'highlights.fresh': 'Fresh Daily',
    'highlights.freshDesc': 'All ingredients prepared fresh every morning',
    'highlights.love': 'Made with Love',
    'highlights.loveDesc': 'Every dish crafted with care and passion',
    'highlights.favorite': 'Local Favorite',
    'highlights.favoriteDesc': '922+ reviews with 4.3★ rating on Cherokee St',
    
    // Featured Section
    'featured.label': 'Our Favorites',
    'featured.title': 'Most Loved Dishes',
    'featured.subtitle': 'Discover our customers\' favorite authentic Mexican dishes, made fresh daily with traditional recipes',
    'featured.popular': 'Popular',
    'featured.viewMenu': 'View Full Menu',
    'featured.tacos': 'Street Tacos',
    'featured.tacosDesc': 'Authentic corn tortillas with your choice of meat',
    'featured.burrito': 'Burrito',
    'featured.burritoDesc': 'Loaded with rice, beans, meat, and fresh toppings',
    'featured.quesadilla': 'Quesadilla',
    'featured.quesadillaDesc': 'Crispy tortilla filled with melted cheese and meat',
    'featured.torta': 'Torta',
    'featured.tortaDesc': 'Mexican sandwich on fresh telera bread',
    
    // Testimonials Section
    'testimonials.label': 'Reviews',
    'testimonials.title': 'What Our Customers Say',
    'testimonials.review1': 'Best tacos in St. Louis! The al pastor is incredible and the salsas are made fresh. Feels like home.',
    'testimonials.review2': 'A hidden gem on Cherokee Street. The tortas are huge and packed with flavor. Great prices too!',
    'testimonials.review3': 'Authentic Mexican food at its finest. The quesadillas are crispy and cheesy. My family loves it here.',
    
    // CTA Section
    'cta.title': 'Ready to Taste Authentic Mexico?',
    'cta.subtitle': 'Visit us on historic Cherokee Street and experience the flavors that have made us a St. Louis favorite',
    'cta.orderNow': 'Order Now',
    'cta.directions': 'Get Directions',
    
    // Menu Section
    'menu.title': 'Our Menu',
    'menu.subtitle': 'Authentic flavors crafted with love. Each dish tells a story of tradition and passion.',
    'menu.foodTitle': 'Food Menu',
    'menu.chooseMeat': 'Choose your meat:',
    'menu.chooseSauce': 'Choose your sauce:',
    'menu.chooseToppings': 'Choose your toppings:',
    'menu.addToCart': 'Add to Cart',
    'menu.drinksTitle': 'Non-Alcoholic Drinks',
    'menu.drinksSubtitle': 'Refreshing beverages to complement your meal',
    'menu.alcoholTitle': 'Alcoholic Drinks',
    'menu.alcoholSubtitle': 'Available in-store only',
    'menu.inStoreOnly': 'In-store only',
    'menu.new': 'NEW',
    'menu.popular': 'POPULAR',
    
    // Menu Items
    'menu.quesadilla': 'Quesadilla',
    'menu.quesadillaDesc': 'A 12" tortilla filled primarily with cheese, your choice of meat, and fresh toppings like cilantro, onion, cucumber, radish.',
    'menu.torta': 'Torta',
    'menu.tortaDesc': 'A large Mexican sandwich filled with your choice of meat. Finished off with mayo, cheese, lettuce, tomato, onion, jalapeños, avocado.',
    'menu.tortaDelChavo': 'Torta Del Chavo',
    'menu.tortaDelChavoDesc': 'A large Mexican sandwich loaded with pork ham and pork cheese. Finished off with mayo, cheese, lettuce, tomato, onion, jalapeños, avocado.',
    'menu.quesadillaHuasteca': 'Quesadilla Wuasteca',
    'menu.quesadillaHuastecaDesc': 'A traditional Huasteca-style quesadilla with your choice of meat, melted cheese, and fresh toppings.',
    'menu.burrito': 'Burrito',
    'menu.burritoDesc': '12" white flour tortilla served with your choice of meat, topped with our fresh cilantro, onion, cucumber, fresh radish and cheese.',
    'menu.tacos': 'Tacos',
    'menu.tacosDesc': '2 small hand-sized white corn tortilla filled with your choice of meat and topped with your choice of fresh toppings.',
    
    // Sauces
    'sauce.noSauce': 'No Sauce',
    'sauce.salsaVerde': 'Salsa Verde',
    'sauce.salsaRoja': 'Salsa Roja',
    'sauce.verdeRoja': 'Verde & Roja',
    
    // Toppings
    'topping.cilantro': 'Cilantro',
    'topping.onion': 'Onion',
    'topping.cucumber': 'Cucumber',
    'topping.radish': 'Radish',
    'topping.lime': 'Lime',
    'topping.cheese': 'Cheese',
    'topping.jalapeno': 'Jalapeño',
    'topping.avocado': 'Avocado',
    
    // Cart
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptyDesc': 'Add some delicious items to get started!',
    'cart.browseMenu': 'Browse Menu',
    'cart.subtotal': 'Subtotal',
    'cart.tax': 'Tax',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout',
    
    // Checkout
    'checkout.title': 'Checkout',
    'checkout.contact': 'Contact Information',
    'checkout.payment': 'Payment Details',
    'checkout.review': 'Review Order',
    'checkout.name': 'Full Name',
    'checkout.email': 'Email',
    'checkout.phone': 'Phone',
    'checkout.cardNumber': 'Card Number',
    'checkout.expiry': 'Expiry Date',
    'checkout.cvv': 'CVV',
    'checkout.back': 'Back',
    'checkout.continue': 'Continue',
    'checkout.placeOrder': 'Place Order',
    'checkout.processing': 'Processing...',
    'checkout.success': 'Order Placed!',
    'checkout.successDesc': 'Thank you for your order. We\'ll have it ready for you soon!',
    'checkout.close': 'Close',
    
    // About Page
    'about.heroTitle': 'Our Story',
    'about.heroSubtitle': 'A family tradition of authentic Mexican flavors on Cherokee Street',
    'about.storyLabel': 'Our Heritage',
    'about.storyTitle': 'Bringing Mexico to St. Louis',
    'about.storyP1': 'Taqueria Hectorito began with a simple dream: to share the authentic flavors of Mexico with our St. Louis community. What started as a small family venture has grown into a beloved neighborhood destination on historic Cherokee Street.',
    'about.storyP2': 'Every dish we serve is crafted with recipes passed down through generations, using the freshest ingredients and traditional techniques that honor our Mexican heritage.',
    'about.valuesLabel': 'Our Values',
    'about.valuesTitle': 'What We Stand For',
    'about.value1Title': 'Family First',
    'about.value1Desc': 'We treat every customer like family, creating a warm and welcoming atmosphere.',
    'about.value2Title': 'Authentic Flavors',
    'about.value2Desc': 'Traditional recipes and techniques that honor our Mexican heritage.',
    'about.value3Title': 'Fresh Ingredients',
    'about.value3Desc': 'Quality ingredients prepared fresh daily for the best taste.',
    'about.value4Title': 'Community Love',
    'about.value4Desc': 'Proud to serve and be part of the Cherokee Street community.',
    'about.galleryLabel': 'Gallery',
    'about.galleryTitle': 'A Glimpse Inside',
    'about.ctaTitle': 'Ready to Experience Taqueria Hectorito?',
    'about.ctaSubtitle': 'Visit us today and taste the authentic flavors of Mexico',
    'about.viewMenu': 'View Our Menu',
    'about.contactUs': 'Contact Us',
    
    // Contact Page
    'contact.heroTitle': 'Contact Us',
    'contact.heroSubtitle': 'We\'d love to hear from you',
    'contact.visitTitle': 'Visit Us',
    'contact.address': 'Address',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.hours': 'Hours',
    'contact.hoursValue': 'Monday - Sunday',
    'contact.openUntil': 'Open until 8 PM',
    'contact.formTitle': 'Send a Message',
    'contact.formName': 'Your Name',
    'contact.formEmail': 'Your Email',
    'contact.formMessage': 'Your Message',
    'contact.formSubmit': 'Send Message',
    
    // Footer
    'footer.description': 'Authentic Mexican restaurant serving the St. Louis community since 2006.',
    'footer.quickLinks': 'Quick Links',
    'footer.popularItems': 'Popular Items',
    'footer.contact': 'Contact',
    'footer.rights': 'All rights reserved.',
    'footer.madeWith': 'Made with ❤️ on Cherokee Street',
  },
  es: {
    // Navbar
    'nav.home': 'Inicio',
    'nav.menu': 'Menú',
    'nav.about': 'Nosotros',
    'nav.contact': 'Contacto',
    'nav.cart': 'Carrito',
    'nav.tagline': 'Restaurante Mexicano',
    'nav.open': 'Abierto',
    'nav.closes': 'Cierra 8 PM',
    
    // Hero
    'hero.rating': 'reseñas',
    'hero.subtitle': 'Restaurante Mexicano',
    'hero.description': 'Cocina mexicana auténtica en la histórica calle Cherokee. Desde tacos hasta tortillas caseras, experimenta los sabores de México.',
    'hero.viewMenu': 'Ver Menú',
    
    // Highlights Section
    'highlights.recipes': 'Recetas Auténticas',
    'highlights.recipesDesc': 'Recetas familiares tradicionales transmitidas por generaciones',
    'highlights.fresh': 'Fresco Diario',
    'highlights.freshDesc': 'Todos los ingredientes preparados frescos cada mañana',
    'highlights.love': 'Hecho con Amor',
    'highlights.loveDesc': 'Cada platillo elaborado con cuidado y pasión',
    'highlights.favorite': 'Favorito Local',
    'highlights.favoriteDesc': '922+ reseñas con 4.3★ en Cherokee St',
    
    // Featured Section
    'featured.label': 'Nuestros Favoritos',
    'featured.title': 'Platillos Más Queridos',
    'featured.subtitle': 'Descubre los platillos mexicanos auténticos favoritos de nuestros clientes, preparados frescos diariamente con recetas tradicionales',
    'featured.popular': 'Popular',
    'featured.viewMenu': 'Ver Menú Completo',
    'featured.tacos': 'Tacos de la Calle',
    'featured.tacosDesc': 'Tortillas de maíz auténticas con tu elección de carne',
    'featured.burrito': 'Burrito',
    'featured.burritoDesc': 'Relleno de arroz, frijoles, carne y toppings frescos',
    'featured.quesadilla': 'Quesadilla',
    'featured.quesadillaDesc': 'Tortilla crujiente rellena de queso derretido y carne',
    'featured.torta': 'Torta',
    'featured.tortaDesc': 'Sándwich mexicano en pan telera fresco',
    
    // Testimonials Section
    'testimonials.label': 'Reseñas',
    'testimonials.title': 'Lo Que Dicen Nuestros Clientes',
    'testimonials.review1': '¡Los mejores tacos en St. Louis! El pastor es increíble y las salsas son frescas. Se siente como en casa.',
    'testimonials.review2': 'Una joya escondida en Cherokee Street. Las tortas son enormes y llenas de sabor. ¡Buenos precios también!',
    'testimonials.review3': 'Comida mexicana auténtica en su máxima expresión. Las quesadillas son crujientes y con queso. A mi familia le encanta.',
    
    // CTA Section
    'cta.title': '¿Listo para Probar México Auténtico?',
    'cta.subtitle': 'Visítanos en la histórica calle Cherokee y experimenta los sabores que nos han hecho favoritos de St. Louis',
    'cta.orderNow': 'Ordenar Ahora',
    'cta.directions': 'Cómo Llegar',
    
    // Menu Section
    'menu.title': 'Nuestro Menú',
    'menu.subtitle': 'Sabores auténticos preparados con amor. Cada platillo cuenta una historia de tradición y pasión.',
    'menu.foodTitle': 'Menú de Comida',
    'menu.chooseMeat': 'Elige tu carne:',
    'menu.chooseSauce': 'Elige tu salsa:',
    'menu.chooseToppings': 'Elige tus toppings:',
    'menu.addToCart': 'Agregar al Carrito',
    'menu.drinksTitle': 'Bebidas Sin Alcohol',
    'menu.drinksSubtitle': 'Bebidas refrescantes para complementar tu comida',
    'menu.alcoholTitle': 'Bebidas con Alcohol',
    'menu.alcoholSubtitle': 'Disponible solo en tienda',
    'menu.inStoreOnly': 'Solo en tienda',
    'menu.new': 'NUEVO',
    'menu.popular': 'POPULAR',
    
    // Menu Items
    'menu.quesadilla': 'Quesadilla',
    'menu.quesadillaDesc': 'Una tortilla de 12" rellena principalmente de queso, tu elección de carne y toppings frescos como cilantro, cebolla, pepino, rábano.',
    'menu.torta': 'Torta',
    'menu.tortaDesc': 'Un sándwich mexicano grande relleno con tu elección de carne. Terminado con mayonesa, queso, lechuga, tomate, cebolla, jalapeños, aguacate.',
    'menu.tortaDelChavo': 'Torta Del Chavo',
    'menu.tortaDelChavoDesc': 'Un sándwich mexicano grande cargado con jamón de cerdo y queso de cerdo. Terminado con mayonesa, queso, lechuga, tomate, cebolla, jalapeños, aguacate.',
    'menu.quesadillaHuasteca': 'Quesadilla Wuasteca',
    'menu.quesadillaHuastecaDesc': 'Una quesadilla tradicional estilo Huasteca con tu elección de carne, queso derretido y toppings frescos.',
    'menu.burrito': 'Burrito',
    'menu.burritoDesc': 'Tortilla de harina blanca de 12" servida con tu elección de carne, cubierta con nuestro cilantro fresco, cebolla, pepino, rábano fresco y queso.',
    'menu.tacos': 'Tacos',
    'menu.tacosDesc': '2 pequeñas tortillas de maíz blanco del tamaño de la mano rellenas con tu elección de carne y cubiertas con tus toppings frescos.',
    
    // Sauces
    'sauce.noSauce': 'Sin Salsa',
    'sauce.salsaVerde': 'Salsa Verde',
    'sauce.salsaRoja': 'Salsa Roja',
    'sauce.verdeRoja': 'Verde y Roja',
    
    // Toppings
    'topping.cilantro': 'Cilantro',
    'topping.onion': 'Cebolla',
    'topping.cucumber': 'Pepino',
    'topping.radish': 'Rábano',
    'topping.lime': 'Limón',
    'topping.cheese': 'Queso',
    'topping.jalapeno': 'Jalapeño',
    'topping.avocado': 'Aguacate',
    
    // Cart
    'cart.title': 'Tu Carrito',
    'cart.empty': 'Tu carrito está vacío',
    'cart.emptyDesc': '¡Agrega algunos artículos deliciosos para empezar!',
    'cart.browseMenu': 'Ver Menú',
    'cart.subtotal': 'Subtotal',
    'cart.tax': 'Impuesto',
    'cart.total': 'Total',
    'cart.checkout': 'Proceder al Pago',
    
    // Checkout
    'checkout.title': 'Pagar',
    'checkout.contact': 'Información de Contacto',
    'checkout.payment': 'Detalles de Pago',
    'checkout.review': 'Revisar Pedido',
    'checkout.name': 'Nombre Completo',
    'checkout.email': 'Correo Electrónico',
    'checkout.phone': 'Teléfono',
    'checkout.cardNumber': 'Número de Tarjeta',
    'checkout.expiry': 'Fecha de Vencimiento',
    'checkout.cvv': 'CVV',
    'checkout.back': 'Atrás',
    'checkout.continue': 'Continuar',
    'checkout.placeOrder': 'Realizar Pedido',
    'checkout.processing': 'Procesando...',
    'checkout.success': '¡Pedido Realizado!',
    'checkout.successDesc': 'Gracias por tu pedido. ¡Lo tendremos listo pronto!',
    'checkout.close': 'Cerrar',
    
    // About Page
    'about.heroTitle': 'Nuestra Historia',
    'about.heroSubtitle': 'Una tradición familiar de sabores mexicanos auténticos en Cherokee Street',
    'about.storyLabel': 'Nuestra Herencia',
    'about.storyTitle': 'Trayendo México a St. Louis',
    'about.storyP1': 'Taqueria Hectorito comenzó con un sueño simple: compartir los sabores auténticos de México con nuestra comunidad de St. Louis. Lo que empezó como una pequeña empresa familiar se ha convertido en un destino querido en la histórica calle Cherokee.',
    'about.storyP2': 'Cada platillo que servimos está elaborado con recetas transmitidas por generaciones, usando los ingredientes más frescos y técnicas tradicionales que honran nuestra herencia mexicana.',
    'about.valuesLabel': 'Nuestros Valores',
    'about.valuesTitle': 'Lo Que Defendemos',
    'about.value1Title': 'Familia Primero',
    'about.value1Desc': 'Tratamos a cada cliente como familia, creando un ambiente cálido y acogedor.',
    'about.value2Title': 'Sabores Auténticos',
    'about.value2Desc': 'Recetas y técnicas tradicionales que honran nuestra herencia mexicana.',
    'about.value3Title': 'Ingredientes Frescos',
    'about.value3Desc': 'Ingredientes de calidad preparados frescos diariamente para el mejor sabor.',
    'about.value4Title': 'Amor Comunitario',
    'about.value4Desc': 'Orgullosos de servir y ser parte de la comunidad de Cherokee Street.',
    'about.galleryLabel': 'Galería',
    'about.galleryTitle': 'Un Vistazo al Interior',
    'about.ctaTitle': '¿Listo para Experimentar Taqueria Hectorito?',
    'about.ctaSubtitle': 'Visítanos hoy y prueba los sabores auténticos de México',
    'about.viewMenu': 'Ver Nuestro Menú',
    'about.contactUs': 'Contáctanos',
    
    // Contact Page
    'contact.heroTitle': 'Contáctanos',
    'contact.heroSubtitle': 'Nos encantaría saber de ti',
    'contact.visitTitle': 'Visítanos',
    'contact.address': 'Dirección',
    'contact.phone': 'Teléfono',
    'contact.email': 'Correo',
    'contact.hours': 'Horario',
    'contact.hoursValue': 'Lunes - Domingo',
    'contact.openUntil': 'Abierto hasta las 8 PM',
    'contact.formTitle': 'Enviar un Mensaje',
    'contact.formName': 'Tu Nombre',
    'contact.formEmail': 'Tu Correo',
    'contact.formMessage': 'Tu Mensaje',
    'contact.formSubmit': 'Enviar Mensaje',
    
    // Footer
    'footer.description': 'Restaurante mexicano auténtico sirviendo a la comunidad de St. Louis desde el primer día.',
    'footer.quickLinks': 'Enlaces Rápidos',
    'footer.popularItems': 'Artículos Populares',
    'footer.contact': 'Contacto',
    'footer.rights': 'Todos los derechos reservados.',
    'footer.madeWith': 'Hecho con ❤️ en la calle Cherokee',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};