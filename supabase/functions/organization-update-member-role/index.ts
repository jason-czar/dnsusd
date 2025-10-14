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

    const { organization_id, member_id, new_role } = await req.json();

    if (!organization_id || !member_id || !new_role) {
      throw new Error("Organization ID, member ID, and new role are required");
    }

    // Get current user's role
    const { data: currentMember } = await supabaseClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", userData.user.id)
      .single();

    if (!currentMember || currentMember.role !== "owner") {
      throw new Error("Unauthorized: Only owners can change member roles");
    }

    // Update member role
    const { error: updateError } = await supabaseClient
      .from("organization_members")
      .update({ role: new_role })
      .eq("id", member_id)
      .eq("organization_id", organization_id);

    if (updateError) throw updateError;

    // Log activity
    await supabaseClient.from("organization_activity_logs").insert({
      organization_id,
      user_id: userData.user.id,
      action: "member_role_changed",
      metadata: { member_id, new_role },
    });

    return new Response(JSON.stringify({ success: true }), {
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