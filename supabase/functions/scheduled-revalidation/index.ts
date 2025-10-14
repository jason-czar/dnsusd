import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Alias {
  id: string;
  alias_string: string;
  verification_method: string;
  current_currency: string;
  current_address: string;
  trust_score: number;
}

interface MonitoringRule {
  id: string;
  user_id: string;
  alias_id: string;
  enabled: boolean;
  alert_email: boolean;
  alert_webhook_url: string | null;
  trust_threshold: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Starting scheduled alias revalidation...');

    // Get all aliases that need revalidation (not verified in last 24 hours or never verified)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: aliases, error: aliasesError } = await supabase
      .from('aliases')
      .select('*')
      .or(`last_verification_at.is.null,last_verification_at.lt.${oneDayAgo}`)
      .limit(50); // Process up to 50 aliases per run

    if (aliasesError) throw aliasesError;

    console.log(`Found ${aliases?.length || 0} aliases to revalidate`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      alertsSent: 0,
    };

    for (const alias of aliases || []) {
      try {
        results.processed++;

        // Prepare addresses for verification
        const expectedAddresses: { [key: string]: string } = {};
        if (alias.current_currency && alias.current_address) {
          expectedAddresses[alias.current_currency] = alias.current_address;
        }

        // Call verification function
        const { data: verificationResult, error: verifyError } = await supabase.functions.invoke(
          'verify-alias-ownership',
          {
            body: {
              aliasId: alias.id,
              domain: alias.alias_string,
              verificationMethod: alias.verification_method || 'dns',
              expectedAddresses,
            },
          }
        );

        if (verifyError) {
          console.error(`Verification failed for ${alias.alias_string}:`, verifyError);
          results.failed++;
          continue;
        }

        results.successful++;
        console.log(`Verified ${alias.alias_string}: Trust score ${verificationResult.trustScore}`);

        // Check if trust score dropped significantly or address changed
        const trustScoreDrop = alias.trust_score - verificationResult.trustScore;
        const oldAddress = alias.current_address;
        const newAddress = verificationResult.resolvedAddress;
        
        if (trustScoreDrop >= 20 || verificationResult.trustScore === 0 || (oldAddress && newAddress && oldAddress !== newAddress)) {
          // Check for monitoring rules
          const { data: rules, error: rulesError } = await supabase
            .from('monitoring_rules')
            .select('*')
            .eq('alias_id', alias.id)
            .eq('enabled', true);

          if (rulesError) {
            console.error('Error fetching monitoring rules:', rulesError);
            continue;
          }

          // Send alerts
          for (const rule of rules || []) {
            try {
              // Check if trust score below threshold
              if (rule.trust_threshold && verificationResult.trustScore >= rule.trust_threshold) {
                continue;
              }

              // Determine alert type and severity
              let alertType = 'trust_score_drop';
              let severity = 'warning';
              let message = `Trust score dropped from ${alias.trust_score} to ${verificationResult.trustScore}`;
              
              if (oldAddress && newAddress && oldAddress !== newAddress) {
                alertType = 'address_change';
                severity = 'critical';
                message = `Address changed from ${oldAddress} to ${newAddress}`;
              } else if (verificationResult.trustScore === 0) {
                alertType = 'verification_failed';
                severity = 'critical';
                message = 'Verification completely failed';
              }

              // Create alert record
              const { data: newAlert, error: alertError } = await supabase
                .from('alerts')
                .insert({
                  user_id: alias.user_id,
                  alias_id: alias.id,
                  rule_id: rule.id,
                  alert_type: alertType,
                  severity,
                  message,
                  metadata: {
                    old_trust_score: alias.trust_score,
                    new_trust_score: verificationResult.trustScore,
                    old_address: oldAddress,
                    new_address: newAddress,
                    verification_details: {
                      dns_verified: verificationResult.dnsVerified || false,
                      https_verified: verificationResult.httpsVerified || false,
                      dnssec_enabled: verificationResult.dnssecEnabled || false,
                    },
                  },
                })
                .select()
                .single();

              if (alertError) {
                console.error('Failed to create alert record:', alertError);
                continue;
              }

              // Send email alert if configured
              if (rule.alert_email && alias.user_id) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('email')
                  .eq('id', alias.user_id)
                  .single();

                if (profile?.email) {
                  try {
                    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-alert-email`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                      },
                      body: JSON.stringify({
                        to: profile.email,
                        aliasString: alias.alias_string,
                        oldTrustScore: alias.trust_score || 0,
                        newTrustScore: verificationResult.trustScore,
                        oldAddress,
                        newAddress,
                        verificationDetails: {
                          dns_verified: verificationResult.dnsVerified || false,
                          https_verified: verificationResult.httpsVerified || false,
                          dnssec_enabled: verificationResult.dnssecEnabled || false,
                        },
                      }),
                    });
                    
                    // Mark email as sent
                    await supabase
                      .from('alerts')
                      .update({ email_sent: true })
                      .eq('id', newAlert.id);
                    
                    results.alertsSent++;
                  } catch (emailError) {
                    console.error('Failed to send alert email:', emailError);
                  }
                }
              }

              // Trigger webhook if configured
              if (rule.alert_webhook_url && newAlert) {
                try {
                  await fetch(rule.alert_webhook_url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      event: alertType,
                      alias: alias.alias_string,
                      previous_score: alias.trust_score,
                      current_score: verificationResult.trustScore,
                      old_address: oldAddress,
                      new_address: newAddress,
                      errors: verificationResult.errors,
                      timestamp: new Date().toISOString(),
                    }),
                  });
                  
                  // Mark webhook as sent
                  await supabase
                    .from('alerts')
                    .update({ webhook_sent: true })
                    .eq('id', newAlert.id);
                  
                  results.alertsSent++;
                } catch (webhookError) {
                  console.error('Failed to send webhook:', webhookError);
                }
              }

              console.log(`Alert sent for ${alias.alias_string} (trust drop: ${trustScoreDrop})`);
            } catch (alertError) {
              console.error('Error sending alert:', alertError);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing alias ${alias.id}:`, error);
        results.failed++;
      }
    }

    console.log('Revalidation complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Scheduled revalidation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
