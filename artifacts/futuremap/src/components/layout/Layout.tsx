import React from "react";
import { Link, useLocation } from "wouter";
import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/language";
import WalletButton from "./WalletButton";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { href: "/", label: t("지도", "Map") },
    { href: "/job", label: t("리포트", "Reports") },
    { href: "/forum", label: t("포럼", "Forum") },
    { href: "/about", label: t("요금제", "Pricing") },
    { href: "/admin", label: t("관리자", "Admin") },
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
