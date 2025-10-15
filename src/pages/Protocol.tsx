import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText, Shield, Zap, Network } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Protocol = () => {
  const navigate = useNavigate();
  const pdfUrl = "/Proof_of_Domain_Identity_PDI_Protocol_v1.2_Draft-3.pdf";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">PDI Protocol Specification</h1>
                <p className="text-sm text-muted-foreground">Proof of Domain Identity v1.2</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Draft v1.2</Badge>
              <Button asChild>
                <a href={pdfUrl} download="PDI_Protocol_v1.2.pdf">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Trust & Verification</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Multi-layer verification system with dynamic trust scoring for crypto address identities across naming systems.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">AI-Powered Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Integrated AI capabilities for risk assessment, pattern analysis, and anomaly detection in domain verification.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Multi-Protocol Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Unified resolution across ENS, DNS, CNS, Unstoppable Domains, Lightning, and more naming protocols.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Document Sections</CardTitle>
            <CardDescription>Navigate through the protocol specification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">Purpose & Design Goals</p>
                  <p className="text-sm text-muted-foreground">Protocol objectives and architecture</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">Trust Scoring Model</p>
                  <p className="text-sm text-muted-foreground">Multi-factor verification system</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">AI Integration</p>
                  <p className="text-sm text-muted-foreground">Machine learning verification layer</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">Implementation Guide</p>
                  <p className="text-sm text-muted-foreground">Integration and API reference</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Viewer */}
        <Card>
          <CardHeader>
            <CardTitle>Full Specification Document</CardTitle>
            <CardDescription>Author: Jason Czarnecki | Last Updated: October 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-lg overflow-hidden" style={{ height: "800px" }}>
              <object
                data={pdfUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                className="border-0"
              >
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Your browser doesn't support PDF viewing. Please download the document to view it.
                  </p>
                  <Button asChild>
                    <a href={pdfUrl} download="PDI_Protocol_v1.2.pdf">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </a>
                  </Button>
                </div>
              </object>
            </div>
          </CardContent>
        </Card>

        {/* Related Resources */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Related Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/docs/api")}>
                API Documentation
              </Button>
              <Button variant="outline" onClick={() => navigate("/docs/sdk")}>
                SDK Documentation
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Protocol;
