import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { token: inviteToken, accept } = await req.json();

    if (!inviteToken) {
      throw new Error("Invitation token is required");
    }

    // Get invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from("organization_invitations")
      .select("*")
      .eq("token", inviteToken)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) {
      throw new Error("Invalid or expired invitation");
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseClient
        .from("organization_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);
      throw new Error("Invitation has expired");
    }

    // Check if email matches
    if (invitation.email.toLowerCase() !== userData.user.email?.toLowerCase()) {
      throw new Error("This invitation was sent to a different email address");
    }

    if (accept) {
      // Add user as member
      const { error: memberError } = await supabaseClient
        .from("organization_members")
        .insert({
          organization_id: invitation.organization_id,
          user_id: userData.user.id,
          role: invitation.role,
        });

      if (memberError) throw memberError;

      // Update invitation status
      await supabaseClient
        .from("organization_invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);

      // Log activity
      await supabaseClient.from("organization_activity_logs").insert({
        organization_id: invitation.organization_id,
        user_id: userData.user.id,
        action: "member_joined",
        metadata: { role: invitation.role },
      });

      return new Response(JSON.stringify({ success: true, message: "Invitation accepted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Decline invitation
      await supabaseClient
        .from("organization_invitations")
        .update({ status: "declined" })
        .eq("id", invitation.id);

      return new Response(JSON.stringify({ success: true, message: "Invitation declined" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});