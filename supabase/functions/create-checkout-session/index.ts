import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ProductKey = "guard_mom_listing_7d" | "guard_mom_care_day" | "breeding_post_listing_7d";

type Body = {
  productKey: ProductKey;
  bookingId?: string;
  /** 결제 성공 후 이동할 경로(쿼리 포함 가능). `/`로 시작, 최대 300자. 예: /create-meetup?kind=mannaja&paid=breeding */
  successPath?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const ALLOWED_KEYS: ProductKey[] = [
  "guard_mom_listing_7d",
  "guard_mom_care_day",
  "breeding_post_listing_7d",
];

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
  const priceGuardMomListing = Deno.env.get("STRIPE_PRICE_GUARD_MOM_LISTING_7D");
  const priceBreedingListing = Deno.env.get("STRIPE_PRICE_BREEDING_POST_LISTING_7D");

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
  if (!productKey || !ALLOWED_KEYS.includes(productKey)) {
    return jsonResponse({ error: "지원하지 않는 상품입니다." }, 400);
  }

  if (productKey === "guard_mom_care_day") {
    const bookingId = typeof parsed.bookingId === "string" ? parsed.bookingId.trim() : "";
    if (!bookingId) {
      return jsonResponse({ error: "bookingId가 필요합니다." }, 400);
    }
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

  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  let mode: Stripe.Checkout.SessionCreateParams.Mode;
  let bookingIdForMeta = "";

  if (productKey === "guard_mom_care_day") {
    const bookingId = parsed.bookingId!.trim();
    const { data: booking, error: bErr } = await supabase
      .from("guard_mom_bookings")
      .select("id, applicant_id, days, per_day_fee_snapshot, total_krw, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bErr || !booking) {
      return jsonResponse({ error: "예약 정보를 찾을 수 없습니다." }, 400);
    }
    if (booking.applicant_id !== user.id) {
      return jsonResponse({ error: "본인 예약만 결제할 수 있습니다." }, 403);
    }
    if (booking.status !== "pending_payment") {
      return jsonResponse({ error: "이미 처리된 예약입니다." }, 400);
    }
    const days = booking.days as number;
    const unit = booking.per_day_fee_snapshot as number;
    const total = days * unit;
    if (total !== booking.total_krw || days < 1 || days > 30 || unit < 1000 || unit > 500000) {
      return jsonResponse({ error: "예약 금액이 올바르지 않습니다." }, 400);
    }

    lineItems = [
      {
        price_data: {
          currency: "krw",
          unit_amount: unit,
          product_data: {
            name: "인증 보호맘 돌봄 (1일 단위)",
            description: `${days}일 · 보호맘 예약`,
          },
        },
        quantity: days,
      },
    ];
    mode = "payment";
    bookingIdForMeta = bookingId;
  } else if (productKey === "breeding_post_listing_7d") {
    if (!priceBreedingListing) {
      return jsonResponse(
        { error: "STRIPE_PRICE_BREEDING_POST_LISTING_7D 가 설정되지 않았습니다." },
        503,
      );
    }
    lineItems = [{ price: priceBreedingListing, quantity: 1 }];
    mode = "payment";
  } else {
    if (!priceGuardMomListing) {
      return jsonResponse(
        { error: "STRIPE_PRICE_GUARD_MOM_LISTING_7D 가 설정되지 않았습니다." },
        503,
      );
    }

    lineItems = [{ price: priceGuardMomListing, quantity: 1 }];
    mode = "payment";
  }

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

  const rawSuccessPath = typeof parsed.successPath === "string" ? parsed.successPath.trim() : "";
  const successPath =
    rawSuccessPath.startsWith("/") &&
    !rawSuccessPath.startsWith("//") &&
    rawSuccessPath.length <= 300
      ? rawSuccessPath
      : "";
  const successJoin = successPath.includes("?") ? "&" : "?";
  const successUrl = successPath
    ? `${publicSiteUrl}${successPath}${successJoin}session_id={CHECKOUT_SESSION_ID}`
    : `${publicSiteUrl}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    successPath.startsWith("/create-meetup")
      ? `${publicSiteUrl}/create-meetup?kind=mannaja&checkout=cancel`
      : `${publicSiteUrl}/billing?checkout=cancel`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      customer_email: user.email ?? undefined,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        product_key: productKey,
        booking_id: bookingIdForMeta,
      },
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
