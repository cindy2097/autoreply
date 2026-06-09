"use client";

import { useState, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

interface ReviewInputProps {
  onSubmit: (text: string, lang: string, platform: string) => void;
  loading: boolean;
  className?: string;
}

export function ReviewInput({ onSubmit, loading, className }: ReviewInputProps) {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("en");
  const [platform, setPlatform] = useState("amazon_sa");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (!text.trim() || loading) return;
    onSubmit(text.trim(), lang, platform);
  }, [text, lang, platform, loading, onSubmit]);

  const handlePaste = useCallback(() => {
    // Read text directly from DOM to avoid stale closure state
    setTimeout(() => {
      const currentText = textareaRef.current?.value?.trim();
      if (currentText && !loading) {
        setText(currentText);
        onSubmit(currentText, lang, platform);
      }
    }, 100);
  }, [lang, platform, loading, onSubmit]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Label className="text-xs">Reply Language</Label>
          <Select value={lang} onValueChange={(v) => v && setLang(v)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Platform</Label>
          <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amazon_sa">Amazon.sa</SelectItem>
              <SelectItem value="amazon_ae">Amazon.ae</SelectItem>
              <SelectItem value="amazon_eg">Amazon.eg</SelectItem>
              <SelectItem value="noon">Noon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder="Paste buyer's review here…"
          className="min-h-[120px] resize-y pr-12"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          disabled={loading}
          dir="auto"
        />
        <Button
          size="icon"
          className="absolute bottom-3 rtl:left-3 ltr:right-3"
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
