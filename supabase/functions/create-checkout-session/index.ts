import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ProductKey = "premium_month" | "meetup_boost";

type Body = {
  productKey: ProductKey;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const publicSiteUrl = (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/$/, "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const pricePremiumMonth = Deno.env.get("STRIPE_PRICE_PREMIUM_MONTHLY");
  const priceMeetupBoost = Deno.env.get("STRIPE_PRICE_MEETUP_BOOST");

  if (!stripeSecret || !supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "서버 환경 변수(Supabase/Stripe)가 설정되지 않았습니다." }, 503);
  }
  if (!publicSiteUrl) {
    return jsonResponse(
      { error: "Edge Function 시크릿 PUBLIC_SITE_URL(프론트 배포 URL, 슬래시 없이)을 설정하세요." },
      503,
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  }

  let parsed: Body;
  try {
    parsed = (await req.json()) as Body;
  } catch {
    return jsonResponse({ error: "잘못된 요청 본문입니다." }, 400);
  }

  const productKey = parsed?.productKey;
  if (productKey !== "premium_month" && productKey !== "meetup_boost") {
    return jsonResponse({ error: "지원하지 않는 상품입니다." }, 400);
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "인증에 실패했습니다." }, 401);
  }

  const priceId =
    productKey === "premium_month" ? pricePremiumMonth : priceMeetupBoost;
  if (!priceId) {
    return jsonResponse(
      {
        error:
          productKey === "premium_month"
            ? "STRIPE_PRICE_PREMIUM_MONTHLY 가 설정되지 않았습니다."
            : "STRIPE_PRICE_MEETUP_BOOST 가 설정되지 않았습니다.",
      },
      503,
    );
  }

  const mode = productKey === "premium_month" ? "subscription" : "payment";

  const { data: order, error: orderError } = await supabase
    .from("billing_orders")
    .insert({
      user_id: user.id,
      product_key: productKey,
      status: "pending",
      currency: "krw",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error(orderError);
    return jsonResponse(
      { error: "주문 생성에 실패했습니다. billing_orders 테이블과 RLS를 확인하세요." },
      500,
    );
  }

  const successUrl = `${publicSiteUrl}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${publicSiteUrl}/billing?checkout=cancel`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      customer_email: user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        product_key: productKey,
      },
      ...(mode === "subscription"
        ? {
            subscription_data: {
              metadata: {
                order_id: order.id,
                user_id: user.id,
                product_key: productKey,
              },
            },
          }
        : {}),
    });

    const { error: updError } = await supabase
      .from("billing_orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    if (updError) {
      console.error(updError);
      return jsonResponse({ error: "주문 업데이트에 실패했습니다." }, 500);
    }

    if (!session.url) {
      return jsonResponse({ error: "Checkout URL을 가져오지 못했습니다." }, 500);
    }

    return jsonResponse({ url: session.url });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: (e as Error).message ?? "Stripe 오류" }, 500);
  }
});
