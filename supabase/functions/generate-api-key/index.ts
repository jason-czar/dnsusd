import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { keyName } = await req.json();

    if (!keyName || keyName.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Key name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (keyName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Key name must be less than 100 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate a secure random API key
    const apiKey = `ar_${generateSecureToken(32)}`;
    
    // Create a hash of the API key for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Extract prefix for display (first 10 chars)
    const keyPrefix = apiKey.substring(0, 10);

    // Store the hashed key in database
    const { data: insertData, error: insertError } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        key_name: keyName.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting API key:", insertError);
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "An API key with this name already exists" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw insertError;
    }

    console.log(`API key generated for user ${user.id}: ${keyName}`);

    // Return the full API key (only time user will see it)
    return new Response(
      JSON.stringify({
        success: true,
        apiKey: apiKey,
        keyData: insertData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-api-key function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateSecureToken(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  
  return result;
}
