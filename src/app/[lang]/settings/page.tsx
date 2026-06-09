"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { trpc } from "@/lib/trpc/client";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Plus, Store } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const t = useTranslations();
  const { user, signOut } = useAuth();
  const trackMutation = trpc.analytics.track.useMutation();

  useEffect(() => {
    trackMutation.mutate({ eventType: "page_view", payload: { page: "settings" } });
  }, []);

  const { data: shops, isLoading } = trpc.shop.list.useQuery(undefined, { enabled: !!user });
  const createShopMutation = trpc.shop.create.useMutation();
  const utils = trpc.useUtils();

  const [showAddShop, setShowAddShop] = useState(false);
  const [shopName, setShopName] = useState("");
  const [platform, setPlatform] = useState("amazon_sa");
  const [defaultLang, setDefaultLang] = useState("en");
  const [defaultTone, setDefaultTone] = useState("professional");

  const handleAddShop = async () => {
    if (!shopName.trim()) return;
    await createShopMutation.mutateAsync({
      platform: platform as "amazon_sa" | "amazon_ae" | "amazon_eg" | "noon",
      shopName,
      defaultLang: defaultLang as "en" | "zh" | "ar",
      defaultTone: defaultTone as "empathetic" | "professional" | "compensation",
    });
    utils.shop.list.invalidate();
    setShowAddShop(false);
    setShopName("");
    toast.success("Shop added");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      {/* Shops */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("settings.shops")}</CardTitle>
            <CardDescription>Manage your connected stores</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddShop(!showAddShop)}>
            <Plus className="h-4 w-4 rtl:ml-1.5 ltr:mr-1.5" />
            {t("settings.addShop")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : (shops?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No shops added yet. Add your first shop to get started.
            </p>
          ) : (
            shops?.map((shop) => (
              <div key={shop.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <Store className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{shop.shop_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {shop.platform} · {shop.default_lang} · {shop.default_tone}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Add shop form */}
          {showAddShop && (
            <div className="space-y-3 border rounded-lg p-4">
              <div className="space-y-1.5">
                <Label>{t("settings.shopName")}</Label>
                <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="My Amazon Store" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("settings.platform")}</Label>
                  <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amazon_sa">Amazon.sa</SelectItem>
                      <SelectItem value="amazon_ae">Amazon.ae</SelectItem>
                      <SelectItem value="amazon_eg">Amazon.eg</SelectItem>
                      <SelectItem value="noon">Noon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("settings.defaultLanguage")}</Label>
                  <Select value={defaultLang} onValueChange={(v) => v && setDefaultLang(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("settings.defaultTone")}</Label>
                  <Select value={defaultTone} onValueChange={(v) => v && setDefaultTone(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empathetic">Empathetic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="compensation">Compensation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowAddShop(false)}>{t("common.cancel")}</Button>
                <Button size="sm" onClick={handleAddShop}>{t("common.save")}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language selector */}
      <Card>
        <CardHeader>
          <CardTitle>Language / اللغة / 语言</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Link href="/dashboard" locale="en">
              <Button variant="outline" size="sm">English</Button>
            </Link>
            <Link href="/dashboard" locale="zh">
              <Button variant="outline" size="sm">中文</Button>
            </Link>
            <Link href="/dashboard" locale="ar">
              <Button variant="outline" size="sm">العربية</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={signOut}>
            {t("nav.signOut")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
