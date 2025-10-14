import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Building2, Plus, Settings, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Organizations() {
  const navigate = useNavigate();
  const { organizations, isPersonalContext, currentOrganization, switchToOrganization } = useOrganization();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organizations and team collaboration
          </p>
        </div>
        <Button onClick={() => navigate("/organizations/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <Card key={org.id} className={currentOrganization?.id === org.id ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">{org.name}</CardTitle>
                </div>
                <Badge variant="secondary">{org.role}</Badge>
              </div>
              <CardDescription>@{org.slug}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    switchToOrganization(org.id);
                    navigate("/dashboard");
                  }}
                  className="flex-1"
                >
                  Switch
                </Button>
                {(org.role === "owner" || org.role === "admin") && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/organizations/${org.id}/members`)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/organizations/${org.id}/settings`)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {organizations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first organization to start collaborating with your team
            </p>
            <Button onClick={() => navigate("/organizations/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}