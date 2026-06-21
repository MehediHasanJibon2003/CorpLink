// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!sig || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  const body = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err);
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { invoice_id, company_id } = session.metadata || {};
    if (invoice_id && company_id) {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", invoice_id);
      if (error) console.error("Failed to update invoice:", error);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
