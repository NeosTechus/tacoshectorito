import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';

const TermsOfServicePage = () => {
  const { isCartOpen, setIsCartOpen } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-4xl font-display font-bold mb-8 text-foreground">Terms of Service</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">
              <strong>Last Updated:</strong> February 2, 2026
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using the Taqueria Hectorito website and online ordering system (the "Site"), 
                you agree to these Terms of Service ("Terms"). If you do not agree, do not use the Site.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Use of the Site</h2>
              <p className="text-muted-foreground">
                You may use the Site only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Use the Site in any way that violates applicable law</li>
                <li>Attempt to gain unauthorized access to the Site or its systems</li>
                <li>Interfere with the operation or security of the Site</li>
                <li>Place fraudulent orders or provide false information</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. Online Orders</h2>
              <p className="text-muted-foreground">
                When placing an order through our Site:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>All orders are subject to acceptance by the restaurant</li>
                <li>Prices are subject to change without notice</li>
                <li>We reserve the right to refuse or cancel any order</li>
                <li>Orders may be cancelled within 2 minutes of placement for a full refund</li>
                <li>Estimated preparation times are approximate and may vary</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Payment</h2>
              <p className="text-muted-foreground">
                Payment is processed securely through our third-party payment provider. By submitting payment, 
                you represent that you are authorized to use the payment method provided. All sales are final 
                once your order has been accepted, except as provided in our cancellation policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Food Allergies and Dietary Restrictions</h2>
              <p className="text-muted-foreground">
                Please inform us of any food allergies or dietary restrictions when placing your order. 
                While we take precautions, our kitchen handles common allergens and we cannot guarantee 
                a completely allergen-free environment. You assume all risk associated with food allergies.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content on the Site, including text, graphics, logos, images, and software, is owned by 
                or licensed to Taqueria Hectorito and is protected by intellectual property laws. You may not 
                copy, modify, or distribute Site content without our prior written consent.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Third-Party Links</h2>
              <p className="text-muted-foreground">
                The Site may contain links to third-party websites. We are not responsible for the content 
                or practices of those sites.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground">
                The Site is provided "as is" and "as available" without warranties of any kind, express or implied, 
                including warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, Taqueria Hectorito shall not be liable for any indirect, 
                incidental, special, or consequential damages arising out of or related to your use of the Site 
                or consumption of our food products.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless Taqueria Hectorito from any claims, damages, or expenses 
                arising from your use of the Site or violation of these Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">11. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms are governed by the laws of the State of Missouri, without regard to conflict of law principles.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">12. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these Terms from time to time. Continued use of the Site after changes are posted 
                constitutes your acceptance of the revised Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">13. Contact</h2>
              <p className="text-muted-foreground">
                If you have questions about these Terms, contact us at:
              </p>
              <p className="text-muted-foreground">
                <strong>Taqueria Hectorito</strong><br />
                2753 Cherokee St<br />
                St. Louis, MO 63118<br />
                Phone: (314) 771-8648<br />
                Email: eltorito.stl@gmail.com
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default TermsOfServicePage;
