/**
 * Webhook Trigger Edge Function (Internal)
 * Triggers registered webhooks when alias addresses change
 * Called internally by resolve-alias function
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate HMAC SHA-256 signature for webhook payload
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alias_id, alias, old_address, new_address, currency } = await req.json();

    console.log(`[WebhookTrigger] Triggering webhooks for alias_id: ${alias_id}`);

    if (!alias_id) {
      return new Response(
        JSON.stringify({ error: 'Missing alias_id parameter' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active webhooks for this alias
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('alias_id', alias_id)
      .eq('is_active', true);

    if (webhooksError) {
      throw webhooksError;
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('[WebhookTrigger] No active webhooks found');
      return new Response(
        JSON.stringify({ message: 'No active webhooks to trigger' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[WebhookTrigger] Found ${webhooks.length} webhooks to trigger`);

    // Trigger each webhook
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const payload = {
            alias: alias,
            old_address: old_address,
            new_address: new_address,
            currency: currency,
            timestamp: new Date().toISOString(),
            webhook_id: webhook.id
          };

          const payloadString = JSON.stringify(payload);
          const signature = await generateSignature(payloadString, webhook.secret_token);

          // Send webhook
          const response = await fetch(webhook.callback_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signature,
              'X-Webhook-Event': 'alias.address.changed'
            },
            body: payloadString
          });

          console.log(`[WebhookTrigger] Webhook ${webhook.id} response: ${response.status}`);

          // Update last_triggered_at
          await supabase
            .from('webhooks')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', webhook.id);

          return {
            webhook_id: webhook.id,
            status: response.status,
            success: response.ok
          };

        } catch (error) {
          console.error(`[WebhookTrigger] Failed to trigger webhook ${webhook.id}:`, error);
          return {
            webhook_id: webhook.id,
            status: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const summary = {
      total: webhooks.length,
      successful: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value.success).length,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'Failed' })
    };

    console.log('[WebhookTrigger] Summary:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[WebhookTrigger] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
