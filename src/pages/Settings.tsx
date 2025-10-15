import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, User, Lock, Bell, Trash2, Save, Settings as SettingsIcon, LogOut } from "lucide-react";
import { z } from "zod";

const displayNameSchema = z.string().trim().min(1, "Display name is required").max(100, "Display name must be less than 100 characters");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

interface Profile {
  display_name: string | null;
  notification_preferences: {
    email_alerts: boolean;
    webhook_alerts: boolean;
    usage_reports: boolean;
  };
  api_preferences: {
    rate_limit_notifications: boolean;
    error_notifications: boolean;
  };
}

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notificationPrefs, setNotificationPrefs] = useState({
    email_alerts: true,
    webhook_alerts: false,
    usage_reports: true,
  });

  const [apiPrefs, setApiPrefs] = useState({
    rate_limit_notifications: true,
    error_notifications: true,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    await fetchProfile(user.id);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setDisplayName(data.display_name || "");
        
        // Parse notification preferences with type safety
        if (data.notification_preferences && typeof data.notification_preferences === 'object') {
          const prefs = data.notification_preferences as any;
          setNotificationPrefs({
            email_alerts: prefs.email_alerts ?? true,
            webhook_alerts: prefs.webhook_alerts ?? false,
            usage_reports: prefs.usage_reports ?? true,
          });
        }
        
        // Parse API preferences with type safety
        if (data.api_preferences && typeof data.api_preferences === 'object') {
          const prefs = data.api_preferences as any;
          setApiPrefs({
            rate_limit_notifications: prefs.rate_limit_notifications ?? true,
            error_notifications: prefs.error_notifications ?? true,
          });
        }
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const validatedName = displayNameSchema.parse(displayName);
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: validatedName,
          notification_preferences: notificationPrefs,
          api_preferences: apiPrefs,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to update profile: " + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      passwordSchema.parse(newPassword);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to change password: " + error.message);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to sign out: " + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);

      // Note: Account deletion would typically require a backend function
      // to properly clean up all user data and then delete the auth user
      toast.info("Account deletion would be processed here. This requires backend implementation.");
      
      // For now, just sign out
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to delete account: " + error.message);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <SettingsIcon size={24} />
              Settings
            </h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div>
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} />
              Change Password
            </CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={!newPassword || !confirmPassword}
            >
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={20} />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose how you want to be notified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for monitoring alerts
                </p>
              </div>
              <Switch
                checked={notificationPrefs.email_alerts}
                onCheckedChange={(checked) =>
                  setNotificationPrefs({ ...notificationPrefs, email_alerts: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Webhook Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Send alerts to configured webhooks
                </p>
              </div>
              <Switch
                checked={notificationPrefs.webhook_alerts}
                onCheckedChange={(checked) =>
                  setNotificationPrefs({ ...notificationPrefs, webhook_alerts: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Usage Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Receive weekly/monthly usage reports
                </p>
              </div>
              <Switch
                checked={notificationPrefs.usage_reports}
                onCheckedChange={(checked) =>
                  setNotificationPrefs({ ...notificationPrefs, usage_reports: checked })
                }
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save size={16} className="mr-2" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle>API Settings</CardTitle>
            <CardDescription>Configure API-related notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Rate Limit Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when approaching rate limits
                </p>
              </div>
              <Switch
                checked={apiPrefs.rate_limit_notifications}
                onCheckedChange={(checked) =>
                  setApiPrefs({ ...apiPrefs, rate_limit_notifications: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Error Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about API errors and failures
                </p>
              </div>
              <Switch
                checked={apiPrefs.error_notifications}
                onCheckedChange={(checked) =>
                  setApiPrefs({ ...apiPrefs, error_notifications: checked })
                }
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save size={16} className="mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut size={20} />
              Session Management
            </CardTitle>
            <CardDescription>Sign out of your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sign Out</Label>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account on this device
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
              >
                <LogOut size={16} className="mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Delete Account</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 size={16} className="mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account,
              all your aliases, API keys, and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
