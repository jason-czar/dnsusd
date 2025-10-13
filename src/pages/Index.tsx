import { useState } from "react";
import { Link } from "react-router-dom";
import { ResolverForm } from "@/components/ResolverForm";
import { ResolutionResult } from "@/components/ResolutionResult";
import { Shield, Zap } from "lucide-react";
import type { ResolverResult } from "@/types/resolver";

const Index = () => {
  const [result, setResult] = useState<ResolverResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 glow-cyan">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AliasResolve</h1>
              <p className="text-sm text-muted-foreground">Crypto Alias Resolver - v0</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6 border border-primary/20">
            <Zap className="w-4 h-4" />
            <span>DNS TXT + ENS Resolution</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Resolve Crypto Aliases
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter a domain or ENS name to discover associated wallet addresses.
            Supports DNS TXT records and Ethereum Name Service.
          </p>
        </div>

        {/* Resolver Form */}
        <div className="mb-8">
          <ResolverForm 
            onResult={setResult} 
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>

        {/* Results Display */}
        {result && (
          <ResolutionResult result={result} />
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-smooth">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">DNS TXT Records</h3>
            <p className="text-sm text-muted-foreground">
              Resolves bitcoin=, ethereum= patterns from domain TXT records
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-smooth">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">ENS Names</h3>
            <p className="text-sm text-muted-foreground">
              Lookup Ethereum addresses via .eth domain names
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-smooth">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Multi-Chain</h3>
            <p className="text-sm text-muted-foreground">
              Support for Bitcoin, Ethereum, and extensible to more chains
            </p>
          </div>
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

export default Index;
