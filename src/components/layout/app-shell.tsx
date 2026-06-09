"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  MessageSquareText,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "nav.dashboard" },
  { href: "/reviews", icon: MessageSquareText, label: "nav.reviews" },
  { href: "/history", icon: History, label: "nav.history" },
  { href: "/settings", icon: Settings, label: "nav.settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't show shell on auth pages
  const isAuthPage = pathname.includes("/login") || pathname.includes("/register");
  if (isAuthPage) return <>{children}</>;

  const Sidebar = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <MessageSquareText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-lg font-bold leading-tight">{t("app.name")}</h1>
          <p className="text-xs text-muted-foreground">{t("app.slogan")}</p>
        </div>
      </div>

      <Separator />

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-3", isActive && "font-semibold")}
              >
                <Icon className="h-4 w-4" />
                {t(label)}
              </Button>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User info */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {user?.email?.slice(0, 2).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">{user?.email ?? ""}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} title={t("nav.signOut")}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 w-64 flex-col bg-card flex rtl:right-0 ltr:left-0">
            <div className="absolute top-3 rtl:left-3 ltr:right-3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <div className="md:hidden flex items-center gap-3 border-b px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <MessageSquareText className="h-5 w-5 text-primary" />
          <h1 className="font-bold">{t("app.name")}</h1>
          <div className="flex-1" />
          {/* Language switcher */}
          <div className="flex gap-1">
            {["en", "zh", "ar"].map((l) => (
              <Link key={l} href={pathname as "/"} locale={l}>
                <Button variant={locale === l ? "secondary" : "ghost"} size="sm" className="text-xs px-2">
                  {l === "en" ? "EN" : l === "zh" ? "中文" : "ع"}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
