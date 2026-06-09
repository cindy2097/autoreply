-- ReplyEase AI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('amazon_sa', 'amazon_ae', 'amazon_eg', 'noon')),
  shop_name TEXT NOT NULL,
  default_lang TEXT NOT NULL DEFAULT 'en' CHECK (default_lang IN ('en', 'zh', 'ar')),
  default_tone TEXT NOT NULL DEFAULT 'professional' CHECK (default_tone IN ('empathetic', 'professional', 'compensation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  input_lang TEXT NOT NULL CHECK (input_lang IN ('en', 'zh', 'ar')),
  emotion TEXT NOT NULL CHECK (emotion IN ('angry', 'disappointed', 'confused', 'neutral')),
  confidence FLOAT NOT NULL DEFAULT 0.5,
  target_platform TEXT NOT NULL CHECK (target_platform IN ('amazon_sa', 'amazon_ae', 'amazon_eg', 'noon')),
  target_language TEXT NOT NULL CHECK (target_language IN ('en', 'zh', 'ar')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  copied_at TIMESTAMPTZ,
  has_edit BOOLEAN NOT NULL DEFAULT false,
  emotion_corrected TEXT CHECK (emotion_corrected IN ('angry', 'disappointed', 'confused', 'neutral')),
  is_completed BOOLEAN NOT NULL DEFAULT false
);

-- Generated reply versions
CREATE TABLE IF NOT EXISTS public.review_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  tone TEXT NOT NULL CHECK (tone IN ('empathetic', 'professional', 'compensation')),
  content TEXT NOT NULL,
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  version_selected BOOLEAN NOT NULL DEFAULT false,
  edited_content TEXT
);

-- Emotion correction feedback
CREATE TABLE IF NOT EXISTS public.emotion_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_emotion TEXT NOT NULL,
  corrected_emotion TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usage quota
CREATE TABLE IF NOT EXISTS public.usage_quota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT NOT NULL DEFAULT 0,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  daily_limit INT NOT NULL DEFAULT 20,
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_generated_at ON public.reviews(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON public.reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_quota_user_date ON public.usage_quota(user_id, date);

-- Row Level Security
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_quota ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users own shops" ON public.shops FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own review_versions" ON public.review_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.reviews WHERE reviews.id = review_versions.review_id AND reviews.user_id = auth.uid()));
CREATE POLICY "Users own emotion_feedback" ON public.emotion_feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own events" ON public.events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own usage_quota" ON public.usage_quota FOR ALL USING (auth.uid() = user_id);

-- Trigger: auto-create usage_quota row for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usage_quota (user_id, date, count, plan, daily_limit)
  VALUES (NEW.id, CURRENT_DATE, 0, 'free', 20);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
