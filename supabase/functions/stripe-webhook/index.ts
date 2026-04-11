import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceRole) {
    return new Response("Missing env", { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
  const admin = createClient(supabaseUrl, serviceRole);

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (e) {
    console.error("Webhook signature verification failed", e);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      const userId = session.metadata?.user_id;
      const productKey = session.metadata?.product_key;

      if (!orderId || !userId) {
        console.error("Missing metadata on session", session.id);
        return new Response("ok", { status: 200 });
      }

      const { data: existing } = await admin
        .from("billing_orders")
        .select("id,status")
        .eq("id", orderId)
        .maybeSingle();

      if (existing?.status === "paid") {
        return new Response("ok", { status: 200 });
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      const { error: orderErr } = await admin
        .from("billing_orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq("id", orderId);

      if (orderErr) {
        console.error("billing_orders update", orderErr);
        return new Response("DB error", { status: 500 });
      }

      if (productKey === "premium_month" && session.mode === "subscription") {
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const customerId =
            typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

          const { error: entErr } = await admin.from("user_entitlements").upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              premium_until: periodEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );

          if (entErr) {
            console.error("user_entitlements upsert", entErr);
            return new Response("DB error", { status: 500 });
          }
        }
      }
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (userId && sub.status === "active") {
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        await admin.from("user_entitlements").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            premium_until: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (userId) {
        await admin
          .from("user_entitlements")
          .update({
            premium_until: new Date().toISOString(),
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }
  } catch (e) {
    console.error(e);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
