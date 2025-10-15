import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ResolverForm } from "@/components/ResolverForm";
import { ResolutionResult } from "@/components/ResolutionResult";
import { Shield, Zap, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { ResolverResult } from "@/types/resolver";
import keyLogo from "@/assets/thumb-screenshot.png";
const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setIsLoggedIn(!!session);
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);
  const [result, setResult] = useState<ResolverResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between" aria-label="Main navigation">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <img src={keyLogo} alt="BlueKeyID Logo" className="w-8 h-8" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Universal Crypto Address Identity Verification</h1>
                <p className="text-sm text-muted-foreground">Universal Crypto Alias Resolver</p>
              </div>
            </div>
            {isLoggedIn ? <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                  Dashboard
                </Button>
              </Link> : <Link to="/auth">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6 border border-primary/20">
            <Zap className="w-4 h-4" aria-hidden="true" />
            <span>14+ Naming Systems Supported</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Universal Crypto Address Identity Verification</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">Link and verify crypto wallet addresses across DNS domains (.com, .io, etc) and email addresses, ENS, Lightning Network, Unstoppable Domains, Handshake, and 10+ more naming systems.</p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Fast, secure, and multi-chain. Get trust scores and ownership verification for every alias.
          </p>
        </section>

        {/* Resolver Form */}
        <div className="mb-8">
          <ResolverForm onResult={setResult} isLoading={isLoading} setIsLoading={setIsLoading} />
        </div>

        {/* Results Display */}
        {result && <ResolutionResult result={result} />}

        {/* Supported Systems */}
        <section className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-8 text-foreground">Supported Naming Systems</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {["ENS (.eth domains)", "DNS Domains & Email Addresses", "Lightning Network", "Unstoppable Domains", "Handshake (.hns)", "Namecoin", "ZNS (Zilliqa)", "CNS (Crypto.com)", "BNS (Bitcoin)", "FIO Protocol", "Nostr addresses", "PayString", "Webfinger", ".well-known/pay"].map(system => <div key={system} className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-border/50">
                <Shield className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-foreground">{system}</span>
              </div>)}
          </div>
        </section>

        {/* Features Grid */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8 text-foreground">Key Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <article className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-smooth">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">Trust Score Verification</h4>
              <p className="text-sm text-muted-foreground">
                Every alias gets a trust score based on DNS verification, HTTPS checks, and DNSSEC validation
              </p>
            </article>

            <article className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-smooth">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">Real-time Monitoring</h4>
              <p className="text-sm text-muted-foreground">
                Track alias changes with automated alerts via email and webhooks when addresses or trust scores change
              </p>
            </article>

            <article className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-smooth">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">Developer API</h4>
              <p className="text-sm text-muted-foreground">
                Integrate alias resolution into your app with our REST API, webhooks, and comprehensive SDKs
              </p>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex flex-col items-center md:items-start gap-2">
              <p className="font-semibold text-foreground">AliasResolve</p>
              <p>Universal crypto alias resolver for Web3</p>
            </div>
            <nav className="flex gap-6" aria-label="Footer navigation">
              <Link to="/docs/api" className="hover:text-foreground transition-smooth">API Docs</Link>
              <Link to="/tos" className="hover:text-foreground transition-smooth">Terms of Service</Link>
              <Link to="/policy" className="hover:text-foreground transition-smooth">Privacy Policy</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;