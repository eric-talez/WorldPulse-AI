import React from "react";
import { Link, useLocation } from "wouter";
import { Globe, Shield } from "lucide-react";
import { useLanguage } from "@/lib/language";
import WalletButton from "./WalletButton";
import { useAdminMe, getAdminMeQueryKey } from "@workspace/api-client-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  // Show /admin in the header only when the current visitor is actually an
  // admin (email-admin cookie OR a wallet listed in ADMIN_WALLETS). For
  // everyone else the link stays hidden so the page is not even discoverable.
  const { data: adminMe } = useAdminMe({
    query: { staleTime: 30_000, retry: false, queryKey: getAdminMeQueryKey() },
  });
  const isAdmin = !!adminMe?.authenticated;

  const navItems = [
    { href: "/", label: t("지도", "Map") },
    { href: "/job", label: t("리포트", "Reports") },
    { href: "/forum", label: t("포럼", "Forum") },
    { href: "/about", label: t("요금제", "Pricing") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col dark">
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Globe className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg tracking-tight text-white">
                  FutureMap <span className="text-primary">AI</span>
                </span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={`cursor-pointer transition-colors ${
                    location === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}>
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-secondary/70 rounded-full p-1 border border-border/60">
              <button
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                  language === "ko" ? "bg-secondary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setLanguage("ko")}
              >
                KO
              </button>
              <button
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                  language === "en" ? "bg-secondary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
            </div>
            {isAdmin && (
              <Link href="/admin">
                <div
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    location.startsWith("/admin")
                      ? "border-primary/60 text-primary bg-primary/10"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {t("관리자", "Admin")}
                </div>
              </Link>
            )}
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
