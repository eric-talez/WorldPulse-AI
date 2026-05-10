import React from "react";
import { Link, useLocation } from "wouter";
import { Globe, Map, Briefcase, MessageSquare, Info } from "lucide-react";
import { useLanguage } from "@/lib/language";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { href: "/", label: t("지도", "Map"), icon: Map },
    { href: "/job", label: t("직업 분석", "Job Analysis"), icon: Briefcase },
    { href: "/forum", label: t("포럼", "Forum"), icon: MessageSquare },
    { href: "/about", label: t("소개", "About"), icon: Info },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col dark">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Globe className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg tracking-tight">FutureMap <span className="text-primary">AI</span></span>
            </div>
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={`cursor-pointer flex items-center gap-2 transition-colors ${
                    location === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="flex items-center bg-secondary rounded-full p-1 border border-border">
              <button
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                  language === "ko" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setLanguage("ko")}
              >
                KO
              </button>
              <button
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                  language === "en" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
