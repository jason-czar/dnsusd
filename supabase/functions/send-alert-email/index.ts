import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertEmailRequest {
  to: string;
  aliasString: string;
  oldTrustScore: number;
  newTrustScore: number;
  oldAddress?: string;
  newAddress?: string;
  verificationDetails: {
    dns_verified: boolean;
    https_verified: boolean;
    dnssec_enabled: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, aliasString, oldTrustScore, newTrustScore, oldAddress, newAddress, verificationDetails }: AlertEmailRequest = await req.json();

    const addressChanged = oldAddress && newAddress && oldAddress !== newAddress;
    const trustScoreDropped = newTrustScore < oldTrustScore;

    let alertType = "Verification Status Update";
    if (addressChanged) {
      alertType = "⚠️ Address Change Detected";
    } else if (trustScoreDropped) {
      alertType = "⚠️ Trust Score Decreased";
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .label { font-weight: bold; color: #666; margin-bottom: 4px; }
            .value { color: #333; font-size: 16px; margin-bottom: 16px; }
            .trust-score { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
            .trust-high { background: #dcfce7; color: #166534; }
            .trust-medium { background: #fef3c7; color: #92400e; }
            .trust-low { background: #fee2e2; color: #991b1b; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${alertType}</h1>
              <p>Alias Monitoring Alert for ${aliasString}</p>
            </div>
            <div class="content">
              ${addressChanged ? `
                <div class="alert-box">
                  <strong>⚠️ Address Change Detected</strong>
                  <p>The resolved address for this alias has changed.</p>
                </div>
              ` : ''}
              
              ${trustScoreDropped ? `
                <div class="alert-box">
                  <strong>⚠️ Trust Score Decreased</strong>
                  <p>The trust score has dropped from ${oldTrustScore} to ${newTrustScore}.</p>
                </div>
              ` : ''}

              <div class="info-box">
                <div class="label">Alias</div>
                <div class="value">${aliasString}</div>

                ${addressChanged ? `
                  <div class="label">Previous Address</div>
                  <div class="value" style="color: #dc2626;">${oldAddress}</div>
                  
                  <div class="label">New Address</div>
                  <div class="value" style="color: #16a34a;">${newAddress}</div>
                ` : `
                  <div class="label">Current Address</div>
                  <div class="value">${newAddress || 'Not resolved'}</div>
                `}

                <div class="label">Trust Score</div>
                <div class="value">
                  ${oldTrustScore !== newTrustScore ? `
                    <span class="trust-score ${oldTrustScore >= 70 ? 'trust-high' : oldTrustScore >= 40 ? 'trust-medium' : 'trust-low'}">${oldTrustScore}</span>
                    →
                  ` : ''}
                  <span class="trust-score ${newTrustScore >= 70 ? 'trust-high' : newTrustScore >= 40 ? 'trust-medium' : 'trust-low'}">${newTrustScore}</span>
                </div>

                <div class="label">Verification Status</div>
                <div class="value">
                  DNS TXT: ${verificationDetails.dns_verified ? '✅' : '❌'}<br>
                  HTTPS JSON: ${verificationDetails.https_verified ? '✅' : '❌'}<br>
                  DNSSEC: ${verificationDetails.dnssec_enabled ? '✅' : '❌'}
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || ''}/dashboard/aliases" class="button">
                  View in Dashboard
                </a>
              </div>

              <div class="footer">
                <p>This is an automated alert from your AliasResolve monitoring system.</p>
                <p>To manage your alerts, visit your dashboard or contact support.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "AliasResolve Alerts <onboarding@resend.dev>",
      to: [to],
      subject: `${alertType}: ${aliasString}`,
      html: emailHtml,
    });

    console.log("Alert email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending alert email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
