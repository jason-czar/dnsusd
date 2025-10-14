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

    const { organization_id, member_id } = await req.json();

    if (!organization_id || !member_id) {
      throw new Error("Organization ID and member ID are required");
    }

    // Get current user's role
    const { data: currentMember } = await supabaseClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", userData.user.id)
      .single();

    if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
      throw new Error("Unauthorized: Only owners and admins can remove members");
    }

    // Get target member
    const { data: targetMember } = await supabaseClient
      .from("organization_members")
      .select("role, user_id")
      .eq("id", member_id)
      .eq("organization_id", organization_id)
      .single();

    if (!targetMember) {
      throw new Error("Member not found");
    }

    // Can't remove owner unless you are the owner
    if (targetMember.role === "owner" && currentMember.role !== "owner") {
      throw new Error("Only owners can remove other owners");
    }

    // Remove member
    const { error: deleteError } = await supabaseClient
      .from("organization_members")
      .delete()
      .eq("id", member_id);

    if (deleteError) throw deleteError;

    // Log activity
    await supabaseClient.from("organization_activity_logs").insert({
      organization_id,
      user_id: userData.user.id,
      action: "member_removed",
      metadata: { removed_user_id: targetMember.user_id },
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