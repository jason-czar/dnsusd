/**
 * Main Alias Resolution Edge Function
 * Orchestrates resolution via multiple providers and tracks history/webhooks
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ResolutionOrchestrator } from './orchestrator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Rate limiting map (in-memory, simple implementation)
 * Production would use Redis or proper rate limiting service
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alias, chain } = await req.json();

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

    // Rate limiting (by IP or API key)
    const identifier = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(identifier)) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      );
    }

    console.log(`[Main] Resolving alias: ${alias}, chain: ${chain || 'all'}`);

    // Initialize orchestrator and resolve
    const orchestrator = new ResolutionOrchestrator();
    const result = await orchestrator.resolve(alias, chain || 'all');

    // Store in database and track changes
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Store in lookups table (for backwards compatibility)
      await supabase.from('lookups').insert({
        alias: alias,
        chain: chain || 'all',
        resolved_address: result.chosen?.address || null,
        alias_type: result.chosen?.source_type || null,
        confidence: result.chosen?.confidence ? result.chosen.confidence.toString() : null,
        proof_metadata: result.chosen?.raw_data || null,
        error_message: result.error || null
      });

      // Update aliases table and track history
      if (result.chosen) {
        const { data: existingAlias } = await supabase
          .from('aliases')
          .select('*')
          .eq('alias_string', alias)
          .single();

        if (existingAlias) {
          // Check if address changed
          const addressChanged = existingAlias.current_address !== result.chosen.address;
          
          if (addressChanged) {
            console.log(`[Main] Address changed for ${alias}: ${existingAlias.current_address} -> ${result.chosen.address}`);
            
            // Update alias
            await supabase
              .from('aliases')
              .update({
                current_address: result.chosen.address,
                current_currency: result.chosen.currency,
                current_source: result.chosen.source_type,
                last_resolved_at: new Date().toISOString()
              })
              .eq('id', existingAlias.id);

            // Add to history
            await supabase.from('alias_history').insert({
              alias_id: existingAlias.id,
              address: result.chosen.address,
              currency: result.chosen.currency,
              source_type: result.chosen.source_type,
              raw_data: result.chosen.raw_data,
              confidence: result.chosen.confidence
            });

            // Trigger webhooks asynchronously (non-blocking)
            supabase.functions.invoke('webhook-trigger', {
              body: {
                alias_id: existingAlias.id,
                alias: alias,
                old_address: existingAlias.current_address,
                new_address: result.chosen.address,
                currency: result.chosen.currency
              }
            }).then(() => {
              console.log('[Main] Webhook trigger called');
            }).catch((err) => {
              console.error('[Main] Webhook trigger failed:', err);
            });
          } else {
            // Just update last_resolved_at
            await supabase
              .from('aliases')
              .update({ last_resolved_at: new Date().toISOString() })
              .eq('id', existingAlias.id);
          }
        } else {
          // First time resolution - create alias
          const { data: newAlias } = await supabase
            .from('aliases')
            .insert({
              alias_string: alias,
              current_address: result.chosen.address,
              current_currency: result.chosen.currency,
              current_source: result.chosen.source_type,
              last_resolved_at: new Date().toISOString()
            })
            .select()
            .single();

          if (newAlias) {
            // Add to history
            await supabase.from('alias_history').insert({
              alias_id: newAlias.id,
              address: result.chosen.address,
              currency: result.chosen.currency,
              source_type: result.chosen.source_type,
              raw_data: result.chosen.raw_data,
              confidence: result.chosen.confidence
            });
          }
        }
      }

      console.log('[Main] Database updated successfully');
    } catch (dbError) {
      console.error('[Main] Database error:', dbError);
      // Don't fail the request if DB fails
    }

    // Return result
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Main] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        alias: null,
        resolved: [],
        chosen: null,
        sources_conflict: false,
        cached: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
