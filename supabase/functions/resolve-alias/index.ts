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
 * Rate limiting configuration by tier
 */
const RATE_LIMITS = {
  free: { limit: 1000, windowMs: 30 * 24 * 60 * 60 * 1000 }, // 1000/month
  pro: { limit: 100000, windowMs: 30 * 24 * 60 * 60 * 1000 }, // 100k/month
  enterprise: { limit: Number.MAX_SAFE_INTEGER, windowMs: 30 * 24 * 60 * 60 * 1000 }, // unlimited
  anonymous: { limit: 10, windowMs: 60 * 60 * 1000 } // 10/hour for non-authenticated
};

/**
 * Check rate limit for user based on tier
 */
async function checkRateLimit(
  userId: string | null, 
  tier: 'free' | 'pro' | 'enterprise' = 'free'
): Promise<{ allowed: boolean; remaining: number; resetAt: number; limit: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the rate limit config for this tier
  const config = userId ? RATE_LIMITS[tier] : RATE_LIMITS.anonymous;
  
  // Calculate window start time
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  // Count requests in current window
  let query = supabase
    .from('api_usage')
    .select('id', { count: 'exact', head: true })
    .eq('endpoint', '/resolve-alias')
    .gte('created_at', windowStart.toISOString());

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // Fail open - allow the request if we can't check
    return { 
      allowed: true, 
      remaining: config.limit, 
      resetAt: now.getTime() + config.windowMs,
      limit: config.limit
    };
  }

  const currentCount = count || 0;
  const allowed = currentCount < config.limit;
  const remaining = Math.max(0, config.limit - currentCount);
  const resetAt = now.getTime() + config.windowMs;

  return { allowed, remaining, resetAt, limit: config.limit };
}

serve(async (req) => {
  const startTime = Date.now();
  let statusCode = 200;
  let errorMessage: string | null = null;
  let userId: string | null = null;
  let rateLimitResult: { allowed: boolean; remaining: number; resetAt: number; limit: number } | null = null;

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

    // Extract user ID for rate limiting
    const authHeader = req.headers.get('authorization');
    userId = null;
    let userTier: 'free' | 'pro' | 'enterprise' = 'free';
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
        
        // TODO: Fetch user tier from database when billing is implemented
        // For now, everyone is on free tier
        userTier = 'free';
      } catch (e) {
        console.log('[Main] Could not extract user from token');
      }
    }

    // Rate limiting
    rateLimitResult = await checkRateLimit(userId, userTier);
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: `Rate limit of ${rateLimitResult.limit} requests exceeded. Resets at ${new Date(rateLimitResult.resetAt).toISOString()}`,
          limit: rateLimitResult.limit,
          remaining: 0,
          resetAt: rateLimitResult.resetAt
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString()
          },
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

    // Track API usage
    const responseTime = Date.now() - startTime;

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('api_usage').insert({
        user_id: userId,
        endpoint: '/resolve-alias',
        method: req.method,
        status_code: statusCode,
        response_time_ms: responseTime,
        error_message: errorMessage,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });
    } catch (usageError) {
      console.error('[Main] Usage tracking error:', usageError);
      // Don't fail the request if usage tracking fails
    }

    // Return result with rate limit headers
    return new Response(
      JSON.stringify(result),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString()
        }
      }
    );

  } catch (error) {
    console.error('[Main] Error:', error);
    statusCode = 500;
    errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Track failed API usage
    const responseTime = Date.now() - startTime;

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('api_usage').insert({
        user_id: userId,
        endpoint: '/resolve-alias',
        method: req.method,
        status_code: statusCode,
        response_time_ms: responseTime,
        error_message: errorMessage,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });
    } catch (usageError) {
      console.error('[Main] Usage tracking error:', usageError);
    }
    
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
