import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Star } from 'lucide-react';

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-semibold uppercase tracking-wider text-sm mb-4 block">
              About Us
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              A Taste of Mexico on Cherokee Street
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              El Torito is more than just a restaurant – it's a family tradition 
              bringing authentic Mexican flavors to St. Louis. Our menu features classic dishes 
              made with recipes passed down through generations, using the freshest ingredients.
            </p>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Whether you're craving our famous tacos or just want to experience 
              the warmth of Mexican hospitality, El Torito welcomes you with open arms.
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
                <span className="text-muted-foreground"> (922 reviews)</span>
              </div>
            </div>
          </motion.div>

          {/* Contact card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            id="contact"
            className="bg-card rounded-2xl p-8 shadow-medium"
          >
            <h3 className="font-display text-2xl font-bold text-card-foreground mb-6">
              Visit Us
            </h3>

            <div className="space-y-6">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-1">Address</h4>
                  <p className="text-muted-foreground">
                    2753 Cherokee St<br />
                    St. Louis, MO 63118
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-1">Phone</h4>
                  <a href="tel:+13147718648" className="text-muted-foreground hover:text-primary transition-colors">
                    (314) 771-8648
                  </a>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-1">Email</h4>
                  <a href="mailto:eltorito.stl@gmail.com" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    eltorito.stl@gmail.com
                  </a>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-1">Hours</h4>
                  <p className="text-muted-foreground">
                    Monday - Sunday<br />
                    <span className="text-accent font-medium">Open until 8 PM</span>
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Map placeholder */}
            <div className="mt-8 rounded-xl overflow-hidden h-48 bg-secondary">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3117.5!2d-90.2!3d38.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDM2JzAwLjAiTiA5MMKwMTInMDAuMCJX!5e0!3m2!1sen!2sus!4v1600000000000!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="El Torito Location"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
