import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const TOS = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-smooth">
              <div className="p-2 rounded-lg bg-primary/10 glow-cyan">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AliasResolve</h1>
                <p className="text-sm text-muted-foreground">Crypto Alias Resolver - v0</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: October 13, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-4">
              By accessing and using AliasResolve ("the Service"), you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              AliasResolve provides a crypto alias resolution service that allows users to resolve domain names and aliases 
              to cryptocurrency wallet addresses through various methods including DNS TXT records, ENS, and other supported 
              naming systems.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Use of Service</h2>
            <p className="text-muted-foreground mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Use the Service in any way that violates applicable laws or regulations</li>
              <li>Attempt to interfere with or disrupt the Service or servers</li>
              <li>Use automated systems to access the Service without authorization</li>
              <li>Misrepresent your identity or affiliation</li>
              <li>Use the Service to transmit malicious code or harmful content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. No Financial Advice</h2>
            <p className="text-muted-foreground mb-4">
              The Service provides technical information only and does not constitute financial, investment, legal, or tax advice. 
              Any decisions you make based on information from this Service are your sole responsibility.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Accuracy of Information</h2>
            <p className="text-muted-foreground mb-4">
              While we strive to provide accurate resolution data, we make no warranties or guarantees about the accuracy, 
              completeness, or reliability of the information provided. Always verify wallet addresses independently before 
              conducting any transactions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              To the maximum extent permitted by law, AliasResolve and its operators shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including loss of funds, resulting from your use of 
              or inability to use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              The Service may rely on third-party APIs, blockchain networks, and naming services. We are not responsible for 
              the availability, accuracy, or functionality of these third-party services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Modifications to Service</h2>
            <p className="text-muted-foreground mb-4">
              We reserve the right to modify, suspend, or discontinue the Service at any time without notice. We will not be 
              liable to you or any third party for any modification, suspension, or discontinuation of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Changes to Terms</h2>
            <p className="text-muted-foreground mb-4">
              We may update these Terms of Service from time to time. Continued use of the Service after changes constitutes 
              acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Contact</h2>
            <p className="text-muted-foreground mb-4">
              For questions about these Terms of Service, please contact us through our official channels.
            </p>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-border">
          <Link 
            to="/" 
            className="text-primary hover:text-primary/80 transition-smooth inline-flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>AliasResolve v0 - Built for crypto alias resolution</p>
            <div className="flex gap-6">
              <Link to="/tos" className="hover:text-foreground transition-smooth">Terms of Service</Link>
              <Link to="/policy" className="hover:text-foreground transition-smooth">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TOS;
