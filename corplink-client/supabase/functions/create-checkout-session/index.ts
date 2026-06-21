// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  try {
    const { amount, currency, productName, invoice_id, company_id } = await req.json();
    if (!invoice_id || !company_id) {
      return new Response(JSON.stringify({ error: "Missing invoice_id or company_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: currency || "usd",
            product_data: { name: productName || `Invoice ${invoice_id}` },
            unit_amount: amount, // amount in cents
          },
          quantity: 1,
        },
      ],
      metadata: { invoice_id, company_id },
      success_url: `${Deno.env.get("VITE_APP_URL") || "http://localhost:5173"}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("VITE_APP_URL") || "http://localhost:5173"}/billing`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
