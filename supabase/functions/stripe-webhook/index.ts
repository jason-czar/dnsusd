import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Stripe credentials not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    logStep("Event verified", { type: event.type, id: event.id });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id });

        const userId = session.metadata?.user_id;
        const organizationId = session.metadata?.organization_id;
        const tier = session.metadata?.tier;
        
        if (!userId || !tier) {
          throw new Error("Missing user_id or tier in session metadata");
        }

        // Create subscription record
        const { error: subError } = await supabaseClient
          .from("subscriptions")
          .insert({
            user_id: userId,
            organization_id: organizationId || null,
            tier: tier,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: "active",
          });

        if (subError) throw subError;

        // Update profile tier for personal subscriptions
        if (!organizationId) {
          const { error: profileError } = await supabaseClient
            .from("profiles")
            .update({ subscription_tier: tier })
            .eq("id", userId);

          if (profileError) throw profileError;
        } else {
          // Log activity for organization subscriptions
          await supabaseClient
            .from("organization_activity_logs")
            .insert({
              organization_id: organizationId,
              user_id: userId,
              action: "subscription_updated",
              metadata: { tier, status: "active" }
            });
        }

        logStep("Subscription created", { userId, organizationId, tier });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id });

        const { error } = await supabaseClient
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) throw error;
        logStep("Subscription updated in DB");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        // Get user_id and organization_id from subscription
        const { data: subData } = await supabaseClient
          .from("subscriptions")
          .select("user_id, organization_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (subData) {
          // Update subscription status
          await supabaseClient
            .from("subscriptions")
            .update({ status: "cancelled" })
            .eq("stripe_subscription_id", subscription.id);

          if (!subData.organization_id) {
            // Revert personal profile to free tier
            await supabaseClient
              .from("profiles")
              .update({ subscription_tier: "free" })
              .eq("id", subData.user_id);
            
            logStep("Personal subscription cancelled, user reverted to free tier");
          } else {
            // Log organization subscription cancellation
            await supabaseClient
              .from("organization_activity_logs")
              .insert({
                organization_id: subData.organization_id,
                user_id: subData.user_id,
                action: "subscription_updated",
                metadata: { status: "cancelled" }
              });
            
            logStep("Organization subscription cancelled");
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id });

        if (invoice.subscription) {
          await supabaseClient
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", invoice.subscription as string);

          logStep("Subscription marked as past_due");
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
