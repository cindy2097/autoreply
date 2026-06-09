// Database type definitions matching Supabase schema

export type Emotion = "angry" | "disappointed" | "confused" | "neutral";
export type Tone = "empathetic" | "professional" | "compensation";
export type Language = "en" | "zh" | "ar";
export type Platform = "amazon_sa" | "amazon_ae" | "amazon_eg" | "noon";
export type EventType =
  | "review_pasted"
  | "review_generated"
  | "review_copied"
  | "emotion_corrected"
  | "tone_switched"
  | "regenerate_clicked"
  | "version_selected"
  | "review_completed"
  | "page_view"
  | "subscription_upgraded";

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Shop {
  id: string;
  user_id: string;
  platform: Platform;
  shop_name: string;
  default_lang: Language;
  default_tone: Tone;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  shop_id: string;
  input_text: string;
  input_lang: Language;
  emotion: Emotion;
  confidence: number;
  target_platform: Platform;
  target_language: Language;
  generated_at: string;
  copied_at: string | null;
  has_edit: boolean;
  emotion_corrected: Emotion | null;
  is_completed: boolean;
}

export interface ReviewVersion {
  id: string;
  review_id: string;
  tone: Tone;
  content: string;
  is_recommended: boolean;
  version_selected: boolean;
  edited_content: string | null;
}

export interface EmotionFeedback {
  id: string;
  review_id: string;
  user_id: string;
  original_emotion: Emotion;
  corrected_emotion: Emotion;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: EventType;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface UsageQuota {
  id: string;
  user_id: string;
  date: string;
  count: number;
  plan: "free" | "pro" | "team";
  daily_limit: number;
}
