// Lightweight regex-based content filter for dangerous expressions
// MVP: hardcoded 50+ keywords covering promises, violations, cultural taboos

const BLOCKED_PATTERNS = [
  // Promise / compensation (Chinese)
  /全额退款/gi,
  /赔偿/gi,
  /双倍/gi,
  /免费送/gi,
  /现金补偿/gi,
  /无条件退/gi,
  /保证退款/gi,
  /赔你/gi,
  /补偿金/gi,
  // Promise / compensation (English)
  /full\s*refund\s*without\s*return/gi,
  /cash\s*compensation/gi,
  /double\s*your\s*money/gi,
  /free\s*gift\s*for/gi,
  /guaranteed\s*refund/gi,

  // Platform violations (Chinese)
  /加微信/gi,
  /WhatsApp[:]*\d*/gi,
  /私下联系/gi,
  /改评价给钱/gi,
  /刷好评/gi,
  /删差评给钱/gi,
  /电话联系我/gi,
  /加我好友/gi,
  /私聊/gi,
  // Platform violations (English)
  /add\s*me\s*on\s*whatsapp/gi,
  /contact\s*me\s*directly/gi,
  /call\s*my\s*(phone|number)/gi,
  /send\s*me\s*a\s*message\s*privately/gi,

  // Dangerous claims (Chinese)
  /质量问题/gi,
  /假货/gi,
  /包你满意/gi,
  /100%正品/gi,
  /保证正品/gi,
  /永远不坏/gi,
  // Dangerous claims (English)
  /\bfake\b/gi,
  /\bcounterfeit\b/gi,
  /not\s*genuine/gi,
  /poor\s*quality\s*(product|item)/gi,
  /defective\s*by\s*design/gi,

  // Islamic cultural taboos (Chinese / English / Arabic)
  /喝酒/gi,
  /酒/gi,
  /猪肉/gi,
  /猪/gi,
  /\bpig\b/gi,
  /alcohol/gi,
  /\bwine\b/gi,
  /\bbeer\b/gi,
  /liquor/gi,
  /不尊重宗教/gi,
  /侮辱伊斯兰/gi,
  /insult\s*islam/gi,
  /حرام/gi,
  /خمر/gi,
  /خنزير/gi,

  // Platform jumping (Chinese / English / Arabic)
  /去我们官网买/gi,
  /在别的平台买/gi,
  /buy\s*from\s*our\s*(website|store)/gi,
  /Noon\s*(is\s*)?better\s*(than\s*)?Amazon/gi,
  /Amazon\s*(is\s*)?better\s*(than\s*)?Noon/gi,
  /نون\s*أفضل\s*من\s*أمازون/gi,
  /أمازون\s*أفضل\s*من\s*نون/gi,
];

export interface FilterResult {
  content: string;
  hasWarning: boolean;
  matchedPatterns: string[];
}

export function filterContent(text: string): FilterResult {
  const matchedPatterns: string[] = [];

  for (const pattern of BLOCKED_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      matchedPatterns.push(pattern.source);
    }
  }

  if (matchedPatterns.length > 0) {
    return {
      content: text,
      hasWarning: true,
      matchedPatterns,
    };
  }

  return { content: text, hasWarning: false, matchedPatterns: [] };
}

export function sanitizeContent(text: string): string {
  let sanitized = text;
  for (const pattern of BLOCKED_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[FILTERED]");
  }
  return sanitized;
}
