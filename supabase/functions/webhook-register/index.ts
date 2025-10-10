/**
 * Webhook Registration Edge Function
 * Allows users to register webhooks for alias change notifications
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate random secret token for webhook HMAC signing
 */
function generateSecretToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alias, callback_url, secret } = await req.json();

    console.log(`[WebhookRegister] Registering webhook for alias: ${alias}`);

    // Validate input
    if (!alias || typeof alias !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid alias parameter' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (!callback_url || typeof callback_url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid callback_url parameter' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Validate callback_url format
    try {
      new URL(callback_url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid callback_url format' }),
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

    // Find or create alias
    const { data: existingAlias } = await supabase
      .from('aliases')
      .select('*')
      .eq('alias_string', alias)
      .single();

    let aliasId: string;

    if (!existingAlias) {
      // Create alias entry
      const { data: newAlias, error: createError } = await supabase
        .from('aliases')
        .insert({
          alias_string: alias,
          current_address: null,
          current_currency: null,
          current_source: null
        })
        .select()
        .single();

      if (createError || !newAlias) {
        throw new Error('Failed to create alias');
      }

      aliasId = newAlias.id;
    } else {
      aliasId = existingAlias.id;
    }

    // Generate secret token if not provided
    const secretToken = secret || generateSecretToken();

    // Register webhook
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .insert({
        alias_id: aliasId,
        callback_url: callback_url,
        secret_token: secretToken,
        is_active: true
      })
      .select()
      .single();

    if (webhookError) {
      throw webhookError;
    }

    console.log(`[WebhookRegister] Webhook registered successfully: ${webhook.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        webhook_id: webhook.id,
        alias: alias,
        callback_url: callback_url,
        secret_token: secretToken,
        message: 'Webhook registered successfully. Store the secret_token to verify webhook signatures.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[WebhookRegister] Error:', error);
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
