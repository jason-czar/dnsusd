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

    const { organization_id, email, role = "member" } = await req.json();

    if (!organization_id || !email) {
      throw new Error("Organization ID and email are required");
    }

    // Check if user is owner or admin
    const { data: member } = await supabaseClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", userData.user.id)
      .single();

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new Error("Unauthorized: Only owners and admins can invite members");
    }

    // Check if already a member
    const { data: existingMember } = await supabaseClient
      .from("organization_members")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (existingMember) {
      throw new Error("User is already a member of this organization");
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from("organization_invitations")
      .insert({
        organization_id,
        email: email.toLowerCase(),
        role,
        invited_by: userData.user.id,
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Log activity
    await supabaseClient.from("organization_activity_logs").insert({
      organization_id,
      user_id: userData.user.id,
      action: "member_invited",
      metadata: { email, role },
    });

    // TODO: Send invitation email using Resend

    return new Response(JSON.stringify(invitation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});