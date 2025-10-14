import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ORG-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

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

    logStep("User authenticated", { userId: userData.user.id });

    const { organization_id, tier } = await req.json();

    if (!organization_id || !tier) {
      throw new Error("Organization ID and tier are required");
    }

    logStep("Creating checkout for organization", { organization_id, tier });

    // Verify user is owner or admin of organization
    const { data: member } = await supabaseClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", userData.user.id)
      .single();

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new Error("Unauthorized: Only owners and admins can manage billing");
    }

    logStep("User authorized", { role: member.role });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Map tier to price ID from environment variables
    const priceIds: { [key: string]: string } = {
      team: Deno.env.get("STRIPE_TEAM_PRICE_ID") || "",
      enterprise: Deno.env.get("STRIPE_ENTERPRISE_PRICE_ID") || "",
    };

    const priceId = priceIds[tier];
    if (!priceId) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    logStep("Price ID determined", { tier, priceId });

    // Check if organization already has a Stripe customer
    const { data: existingSubscription } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", organization_id)
      .single();

    let customerId = existingSubscription?.stripe_customer_id;

    // If no customer exists, check by email and create if needed
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: userData.user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    logStep("Customer determined", { customerId: customerId || "will_be_created" });

    const origin = req.headers.get("origin") || "http://localhost:8080";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userData.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/organizations/${organization_id}/settings?tab=billing`,
      cancel_url: `${origin}/organizations/${organization_id}/settings?tab=billing`,
      metadata: {
        organization_id,
        user_id: userData.user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});