import type { Emotion, Tone, Language } from "@/server/db/schema";

// L3 fallback: static template replies when all LLM providers are down
// 4 emotions × 3 languages × 3 tones = 36 total, but we store 12 (emotion × lang with best tone)

type FallbackKey = `${Emotion}_${Language}`;

const fallbacks: Record<FallbackKey, string> = {
  angry_en:
    "We hear your frustration and we're truly sorry this happened. This is not the experience we want for our customers. Please reach out to us through the platform's messaging system so we can investigate and make this right for you.",
  angry_zh:
    "我们完全理解您的愤怒，对此我们深表歉意。这不是我们期望给客户带来的体验。请通过平台消息系统联系我们，我们将立即为您调查处理。",
  angry_ar:
    "نحن نتفهم شعورك بالغضب ونعتذر بشدة عن هذه التجربة. هذا ليس ما نريده لعملائنا. يرجى التواصل معنا عبر نظام مراسلة المنصة وسنتحقق من الأمر فورًا.",
  disappointed_en:
    "Thank you for sharing your experience. We're sorry we didn't meet your expectations. Your feedback matters to us and we'll use it to improve. Please let us know if there's anything we can do to help.",
  disappointed_zh:
    "感谢您分享您的体验。很抱歉我们未能达到您的期望。您的反馈对我们非常重要，我们将以此改进。如有任何需要我们帮助的地方，请随时告诉我们。",
  disappointed_ar:
    "شكرًا لمشاركتك تجربتك. نأسف لأننا لم نلبِّ توقعاتك. ملاحظاتك تهمنا وسنعمل على تحسين خدماتنا. يرجى إعلامنا إذا كان هناك أي شيء يمكننا فعله للمساعدة.",
  confused_en:
    "We appreciate you reaching out. We'd like to help clarify your concerns — please share more details through the platform's messaging system and we'll look into this promptly.",
  confused_zh:
    "感谢您的反馈。我们很乐意帮您澄清疑虑——请通过平台消息系统提供更多详细信息，我们将尽快为您核实。",
  confused_ar:
    "نقدر تواصلك معنا. نود مساعدتك في توضيح استفساراتك — يرجى مشاركة المزيد من التفاصيل عبر نظام مراسلة المنصة وسنتحقق من الأمر فورًا.",
  neutral_en:
    "Thank you for your review. We value your feedback and will use it to keep improving. If you need any assistance with your order, our team is here to help through the platform's messaging system.",
  neutral_zh:
    "感谢您的评价。我们重视您的反馈，并将持续改进。如需任何订单帮助，请通过平台消息系统联系我们，我们随时为您服务。",
  neutral_ar:
    "شكرًا على تقييمك. نقدّر ملاحظاتك وسنستخدمها للتحسين المستمر. إذا كنت بحاجة إلى أي مساعدة بخصوص طلبك، فريقنا موجود للمساعدة عبر نظام مراسلة المنصة.",
};

export function getFallbackReply(emotion: Emotion, language: Language): { content: string; tone: Tone } {
  const key: FallbackKey = `${emotion}_${language}`;
  const content = fallbacks[key] ?? fallbacks.neutral_en;

  const tone: Tone = emotion === "angry" ? "empathetic" : emotion === "disappointed" ? "compensation" : "professional";

  return { content, tone };
}

export function getAllFallbackVersions(
  emotion: Emotion,
  language: Language,
): Array<{ content: string; tone: Tone; isRecommended: boolean }> {
  const primary = getFallbackReply(emotion, language);
  return [
    { content: primary.content, tone: primary.tone, isRecommended: true },
    {
      content: primary.content.replace(
        language === "ar" ? /نحن نتفهم/g : language === "zh" ? /我们/g : /We/g,
        language === "ar" ? "نشكرك على" : language === "zh" ? "感谢您" : "Thank you for",
      ),
      tone: "professional" as Tone,
      isRecommended: false,
    },
    {
      content: primary.content,
      tone: "compensation" as Tone,
      isRecommended: false,
    },
  ];
}
