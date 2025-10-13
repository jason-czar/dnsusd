import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Policy = () => {
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
          <h1 className="text-4xl font-bold mb-2 text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: October 13, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              This Privacy Policy describes how AliasResolve ("we", "our", or "the Service") collects, uses, and protects 
              your information when you use our crypto alias resolution service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-foreground">2.1 Query Information</h3>
            <p className="text-muted-foreground mb-4">
              When you use the Service to resolve aliases, we temporarily process:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Domain names and aliases you submit for resolution</li>
              <li>The blockchain or cryptocurrency type you're querying</li>
              <li>Timestamp of your query</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-foreground">2.2 Technical Information</h3>
            <p className="text-muted-foreground mb-4">
              We may collect standard technical information including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>IP address (for rate limiting and abuse prevention)</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Access times and referring URLs</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-foreground">2.3 No User Accounts</h3>
            <p className="text-muted-foreground mb-4">
              Currently, AliasResolve does not require user registration or maintain user accounts. Therefore, we do not 
              collect personal identification information such as names, email addresses, or authentication credentials.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Service Provision:</strong> To process your alias resolution requests</li>
              <li><strong>Performance Optimization:</strong> To improve response times and caching efficiency</li>
              <li><strong>Security:</strong> To prevent abuse, fraud, and unauthorized access</li>
              <li><strong>Analytics:</strong> To understand usage patterns and improve the Service</li>
              <li><strong>Debugging:</strong> To identify and fix technical issues</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Retention</h2>
            <p className="text-muted-foreground mb-4">
              Query data is retained temporarily:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Cache Data:</strong> Resolution results may be cached for up to 24 hours to improve performance</li>
              <li><strong>Logs:</strong> Server logs are retained for up to 30 days for debugging and security purposes</li>
              <li><strong>Analytics:</strong> Aggregated, anonymized usage statistics may be retained indefinitely</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              To provide alias resolution, we interact with third-party services:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>DNS Providers:</strong> For DNS TXT record lookups</li>
              <li><strong>Blockchain Networks:</strong> Ethereum, Bitcoin, and other blockchain RPCs</li>
              <li><strong>Naming Services:</strong> ENS, Unstoppable Domains, Handshake, and other resolution protocols</li>
              <li><strong>Cloud Infrastructure:</strong> For hosting and edge function execution</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              These services may have their own privacy policies and data handling practices. We recommend reviewing their 
              policies independently.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell, trade, or rent your information to third parties. We may share information only in the 
              following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Legal Requirements:</strong> When required by law or in response to valid legal process</li>
              <li><strong>Security:</strong> To protect against fraud, abuse, or security threats</li>
              <li><strong>Service Providers:</strong> With trusted third-party services necessary for operation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Data Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Rate limiting and DDoS protection</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground mb-4">
              The Service may use cookies or similar technologies for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Session management</li>
              <li>Performance optimization</li>
              <li>Analytics and usage tracking</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              You can control cookies through your browser settings, though this may affect functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Request access to your data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of certain data collection</li>
              <li>Object to processing of your data</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Given the anonymous nature of the Service, exercising some rights may be limited.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Children's Privacy</h2>
            <p className="text-muted-foreground mb-4">
              The Service is not intended for individuals under 13 years of age. We do not knowingly collect information 
              from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. International Users</h2>
            <p className="text-muted-foreground mb-4">
              Your information may be transferred to and processed in countries other than your own. By using the Service, 
              you consent to such transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Changes to Privacy Policy</h2>
            <p className="text-muted-foreground mb-4">
              We may update this Privacy Policy from time to time. Continued use of the Service after changes constitutes 
              acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Contact Information</h2>
            <p className="text-muted-foreground mb-4">
              For questions or concerns about this Privacy Policy or our data practices, please contact us through our 
              official channels.
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

export default Policy;
