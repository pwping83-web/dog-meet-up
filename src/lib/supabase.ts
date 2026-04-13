import { createClient } from '@supabase/supabase-js';

/** 스크린샷 기준 새 프로젝트(서울). `.env`의 VITE_SUPABASE_URL이 있으면 그걸 우선합니다. */
const DEFAULT_SUPABASE_URL = 'https://silbyvmcuymjewurkrfn.supabase.co';

/**
 * anon public 키는 프로젝트마다 다릅니다. 대시보드 Project Settings → API 에서 복사해
 * `VITE_SUPABASE_ANON_KEY` 로 넣으세요. 없으면 클라이언트만 생성되고 API는 실패합니다.
 */
const PLACEHOLDER_ANON = 'replace-with-anon-key-from-supabase-dashboard';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || PLACEHOLDER_ANON;

if (import.meta.env.DEV && supabaseAnonKey === PLACEHOLDER_ANON) {
  console.warn(
    '[댕댕마켓] VITE_SUPABASE_ANON_KEY 가 없습니다. Supabase → Project Settings → API → Project API keys 에서 anon(JWT) 또는 sb_publishable_… 키를 `.env`에 넣으세요.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          phone: string | null;
          region_si: string | null;
          region_gu: string | null;
          avatar_url: string | null;
          is_repairer: boolean;
        };
        Insert: {
          id: string;
          created_at?: string;
          name: string;
          phone?: string | null;
          region_si?: string | null;
          region_gu?: string | null;
          avatar_url?: string | null;
          is_repairer?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          phone?: string | null;
          region_si?: string | null;
          region_gu?: string | null;
          avatar_url?: string | null;
          is_repairer?: boolean;
        };
      };
      repairers: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          business_name: string;
          description: string | null;
          specialties: string[];
          service_regions_si: string[];
          service_regions_gu: string[];
          latitude: number | null;
          longitude: number | null;
          rating: number;
          review_count: number;
          verified: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          business_name: string;
          description?: string | null;
          specialties?: string[];
          service_regions_si?: string[];
          service_regions_gu?: string[];
          latitude?: number | null;
          longitude?: number | null;
          rating?: number;
          review_count?: number;
          verified?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          business_name?: string;
          description?: string | null;
          specialties?: string[];
          service_regions_si?: string[];
          service_regions_gu?: string[];
          latitude?: number | null;
          longitude?: number | null;
          rating?: number;
          review_count?: number;
          verified?: boolean;
        };
      };
      repair_requests: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          category: string;
          title: string;
          description: string;
          images: string[];
          region_si: string;
          region_gu: string;
          latitude: number | null;
          longitude: number | null;
          status: 'open' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
          quote_count: number;
          view_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          category: string;
          title: string;
          description: string;
          images?: string[];
          region_si: string;
          region_gu: string;
          latitude?: number | null;
          longitude?: number | null;
          status?: 'open' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
          quote_count?: number;
          view_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          category?: string;
          title?: string;
          description?: string;
          images?: string[];
          region_si?: string;
          region_gu?: string;
          latitude?: number | null;
          longitude?: number | null;
          status?: 'open' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
          quote_count?: number;
          view_count?: number;
        };
      };
      quotes: {
        Row: {
          id: string;
          request_id: string;
          repairer_id: string;
          created_at: string;
          amount: number;
          message: string | null;
          estimated_days: number | null;
          status: 'pending' | 'accepted' | 'rejected';
        };
        Insert: {
          id?: string;
          request_id: string;
          repairer_id: string;
          created_at?: string;
          amount: number;
          message?: string | null;
          estimated_days?: number | null;
          status?: 'pending' | 'accepted' | 'rejected';
        };
        Update: {
          id?: string;
          request_id?: string;
          repairer_id?: string;
          created_at?: string;
          amount?: number;
          message?: string | null;
          estimated_days?: number | null;
          status?: 'pending' | 'accepted' | 'rejected';
        };
      };
      messages: {
        Row: {
          id: string;
          created_at: string;
          sender_id: string;
          receiver_id: string;
          request_id: string | null;
          content: string;
          read: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          sender_id: string;
          receiver_id: string;
          request_id?: string | null;
          content: string;
          read?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          sender_id?: string;
          receiver_id?: string;
          request_id?: string | null;
          content?: string;
          read?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          type: 'new_quote' | 'quote_accepted' | 'new_message' | 'review' | 'system';
          title: string;
          message: string;
          link: string | null;
          read: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          type: 'new_quote' | 'quote_accepted' | 'new_message' | 'review' | 'system';
          title: string;
          message: string;
          link?: string | null;
          read?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          type?: 'new_quote' | 'quote_accepted' | 'new_message' | 'review' | 'system';
          title?: string;
          message?: string;
          link?: string | null;
          read?: boolean;
        };
      };
      billing_orders: {
        Row: {
          id: string;
          user_id: string;
          product_key: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          amount_subtotal: number | null;
          currency: string;
          status: 'pending' | 'paid' | 'failed' | 'refunded';
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_key: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_subtotal?: number | null;
          currency?: string;
          status?: 'pending' | 'paid' | 'failed' | 'refunded';
          created_at?: string;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_key?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_subtotal?: number | null;
          currency?: string;
          status?: 'pending' | 'paid' | 'failed' | 'refunded';
          created_at?: string;
          paid_at?: string | null;
        };
      };
      user_entitlements: {
        Row: {
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          premium_until: string | null;
          breeding_listing_until: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          premium_until?: string | null;
          breeding_listing_until?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          premium_until?: string | null;
          breeding_listing_until?: string | null;
          updated_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: string;
          is_promo_mode: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          is_promo_mode?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_promo_mode?: boolean;
          updated_at?: string;
        };
      };
      certified_guard_moms: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          intro: string;
          region_si: string;
          region_gu: string;
          per_day_fee_krw: number;
          offers_daeng_pickup: boolean;
          certified_at: string | null;
          listing_visible_until: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          intro?: string;
          region_si?: string;
          region_gu?: string;
          per_day_fee_krw?: number;
          offers_daeng_pickup?: boolean;
          certified_at?: string | null;
          listing_visible_until?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          intro?: string;
          region_si?: string;
          region_gu?: string;
          per_day_fee_krw?: number;
          offers_daeng_pickup?: boolean;
          certified_at?: string | null;
          listing_visible_until?: string | null;
        };
      };
      guard_mom_bookings: {
        Row: {
          id: string;
          created_at: string;
          guard_mom_id: string;
          applicant_id: string;
          days: number;
          start_date: string;
          end_date: string;
          message: string;
          per_day_fee_snapshot: number;
          total_krw: number;
          status:
            | 'pending_payment'
            | 'paid'
            | 'cancelled'
            | 'refund_requested'
            | 'refunded';
        };
        Insert: {
          id?: string;
          created_at?: string;
          guard_mom_id: string;
          applicant_id: string;
          days: number;
          start_date: string;
          end_date: string;
          message?: string;
          per_day_fee_snapshot: number;
          total_krw: number;
          status?: 'pending_payment' | 'paid' | 'cancelled' | 'refund_requested' | 'refunded';
        };
        Update: {
          id?: string;
          created_at?: string;
          guard_mom_id?: string;
          applicant_id?: string;
          days?: number;
          start_date?: string;
          end_date?: string;
          message?: string;
          per_day_fee_snapshot?: number;
          total_krw?: number;
          status?: 'pending_payment' | 'paid' | 'cancelled' | 'refund_requested' | 'refunded';
        };
      };
    };
  };
}