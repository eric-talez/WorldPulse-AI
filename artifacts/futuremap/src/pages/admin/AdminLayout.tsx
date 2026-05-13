import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useAdminMe,
  useAdminLogout,
  getAdminMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/language";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Image as ImageIcon,
  LogOut,
  Loader2,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const qc = useQueryClient();
  const { data, isLoading } = useAdminMe({
    query: { staleTime: 30_000, retry: false, queryKey: getAdminMeQueryKey() },
  });
  const logout = useAdminLogout();

  useEffect(() => {
    if (!isLoading && !data?.authenticated) {
      setLocation("/admin/login");
    }
  }, [isLoading, data, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        {t("불러오는 중...", "Loading...")}
      </div>
    );
  }

  if (!data?.authenticated) return null;

  const links = [
    { href: "/admin", label: t("대시보드", "Dashboard"), icon: LayoutDashboard },
    { href: "/admin/users", label: t("유저", "Users"), icon: Users },
    { href: "/admin/forum", label: t("포럼", "Forum"), icon: MessageSquare },
    { href: "/admin/banners", label: t("배너", "Banners"), icon: ImageIcon },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-56 flex-shrink-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            {t("관리자", "Admin")}
          </div>
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {links.map((l) => {
              const active =
                location === l.href ||
                (l.href !== "/admin" && location.startsWith(l.href));
              const Icon = l.icon;
              return (
                <Link key={l.href} href={l.href}>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors whitespace-nowrap ${
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {l.label}
                  </div>
                </Link>
              );
            })}
            <button
              onClick={() => {
                logout.mutate(undefined, {
                  onSuccess: () => {
                    qc.invalidateQueries({ queryKey: getAdminMeQueryKey() });
                    setLocation("/admin/login");
                  },
                });
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-secondary/50 mt-2"
            >
              <LogOut className="w-4 h-4" />
              {t("로그아웃", "Sign out")}
            </button>
          </nav>
          <div className="hidden md:block mt-6 text-[11px] text-muted-foreground">
            {data.email}
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
