"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ReplyCardProps {
  content: string;
  tone: string;
  isRecommended: boolean;
  hasWarning: boolean;
  onCopy?: () => void;
  className?: string;
}

export function ReplyCard({ content, tone, isRecommended, hasWarning, onCopy, className }: ReplyCardProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent);
    setCopied(true);
    toast.success("Copied to clipboard ✓");
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <Card
      className={cn(
        "transition-all",
        isRecommended && "ring-2 ring-primary/40",
        hasWarning && "ring-1 ring-yellow-400",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize text-xs">
            {tone}
          </Badge>
          {isRecommended && (
            <Badge className="text-xs bg-primary/10 text-primary border-0">★ Recommended</Badge>
          )}
          {hasWarning && (
            <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600 bg-yellow-50">
              ⚠ Review needed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onBlur={() => setEditing(false)}
            className="min-h-[100px] resize-none"
            autoFocus
          />
        ) : (
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap cursor-text hover:bg-muted/50 rounded p-1 -m-1"
            onClick={() => setEditing(true)}
          >
            {editedContent}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="secondary" size="sm" className="w-full gap-2" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </CardFooter>
    </Card>
  );
}
