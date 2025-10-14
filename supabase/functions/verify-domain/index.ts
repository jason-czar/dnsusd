import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationResult {
  dns_verified: boolean;
  https_verified: boolean;
  dnssec_enabled: boolean;
  dns_error?: string;
  https_error?: string;
  dns_records?: any[];
  https_response?: any;
}

serve(async (req: Request) => {
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

    const { aliasId, domain, expectedAddress, expectedCurrency } = await req.json();

    if (!aliasId || !domain) {
      return new Response(
        JSON.stringify({ error: "Alias ID and domain are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Verifying domain: ${domain} for user ${user.id}`);

    const result: VerificationResult = {
      dns_verified: false,
      https_verified: false,
      dnssec_enabled: false,
    };

    // Check DNS TXT records
    try {
      const dnsResponse = await fetch(
        `https://dns.google/resolve?name=${domain}&type=TXT`
      );
      const dnsData = await dnsResponse.json();

      console.log("DNS lookup result:", JSON.stringify(dnsData));

      if (dnsData.Answer) {
        result.dns_records = dnsData.Answer;
        
        // Look for OpenAlias records
        const openAliasRecords = dnsData.Answer.filter((record: any) =>
          record.data?.includes("oa1:")
        );

        if (openAliasRecords.length > 0) {
          // Parse OpenAlias record
          const record = openAliasRecords[0].data.replace(/"/g, "");
          if (
            record.includes(`recipient_address=${expectedAddress}`) &&
            record.includes(`recipient_name=${expectedCurrency}`)
          ) {
            result.dns_verified = true;
          }
        }

        // Check for DNSSEC
        if (dnsData.AD === true) {
          result.dnssec_enabled = true;
        }
      } else {
        result.dns_error = "No TXT records found";
      }
    } catch (error: any) {
      console.error("DNS verification error:", error);
      result.dns_error = error.message;
    }

    // Check HTTPS endpoint
    try {
      const httpsUrl = `https://${domain}/.well-known/openalias.txt`;
      console.log(`Checking HTTPS endpoint: ${httpsUrl}`);

      const httpsResponse = await fetch(httpsUrl, {
        method: "GET",
        headers: {
          "User-Agent": "AliasResolve-Verifier/1.0",
        },
      });

      if (httpsResponse.ok) {
        const content = await httpsResponse.text();
        result.https_response = { status: httpsResponse.status, content };

        // Check if content contains the expected address
        if (
          content.includes(expectedAddress) &&
          content.includes(expectedCurrency)
        ) {
          result.https_verified = true;
        }
      } else {
        result.https_error = `HTTP ${httpsResponse.status}`;
      }
    } catch (error: any) {
      console.error("HTTPS verification error:", error);
      result.https_error = error.message;
    }

    // Calculate trust score
    let trustScore = 0;
    if (result.dns_verified) trustScore += 40;
    if (result.https_verified) trustScore += 40;
    if (result.dnssec_enabled) trustScore += 20;

    // Update alias in database
    const { error: updateError } = await supabase
      .from("aliases")
      .update({
        dns_verified: result.dns_verified,
        https_verified: result.https_verified,
        dnssec_enabled: result.dnssec_enabled,
        trust_score: trustScore,
        last_verification_at: new Date().toISOString(),
        verification_method: result.dns_verified
          ? "dns"
          : result.https_verified
          ? "https"
          : null,
      })
      .eq("id", aliasId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating alias:", updateError);
      throw updateError;
    }

    console.log(
      `Verification complete for ${domain}: DNS=${result.dns_verified}, HTTPS=${result.https_verified}, Score=${trustScore}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        result,
        trustScore,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-domain function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
