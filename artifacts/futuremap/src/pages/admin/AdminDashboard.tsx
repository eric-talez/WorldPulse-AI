import React from "react";
import {
  useAdminUserStats,
  useAdminForumStats,
  useAdminCountryStats,
  useListCountries,
} from "@workspace/api-client-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useLanguage } from "@/lib/language";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserMinus, Calendar, MessageSquare, MessagesSquare, Flame } from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const { data: userStats } = useAdminUserStats();
  const { data: forumStats } = useAdminForumStats();
  const { data: countryStats } = useAdminCountryStats();
  const { data: countries } = useListCountries();

  const countryName = (code: string) => {
    const c = countries?.find((x) => x.code === code);
    if (!c) return code;
    return `${c.flag} ${language === "ko" ? c.nameKo : c.name}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("대시보드", "Dashboard")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("운영 현황 한눈에 보기", "At-a-glance operational health")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Users}
            label={t("전체 유저", "Total users")}
            value={userStats?.totalUsers ?? "-"}
          />
          <StatCard
            icon={Calendar}
            label={t("오늘 신규", "New today")}
            value={userStats?.newToday ?? "-"}
          />
          <StatCard
            icon={Calendar}
            label={t("이번 주 신규", "New this week")}
            value={userStats?.newThisWeek ?? "-"}
          />
          <StatCard
            icon={UserMinus}
            label={t("누적 탈퇴", "Deactivated")}
            value={userStats?.deactivatedUsers ?? "-"}
          />
        </div>

        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-base">
              {t("최근 30일 가입·탈퇴 추이", "Last 30 days — signups & deactivations")}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userStats?.daily ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="signups"
                  name={t("가입", "Signups")}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="deactivations"
                  name={t("탈퇴", "Deactivations")}
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-3">
          <StatCard
            icon={MessageSquare}
            label={t("전체 글", "Total posts")}
            value={forumStats?.totalPosts ?? "-"}
          />
          <StatCard
            icon={MessagesSquare}
            label={t("전체 댓글", "Total comments")}
            value={forumStats?.totalComments ?? "-"}
          />
          <StatCard
            icon={Flame}
            label={t("핫한 포럼 (최근 7일)", "Hot posts (7d)")}
            value={forumStats?.hot.length ?? "-"}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-base">
                {t("국가별 글 수", "Posts per country")}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(forumStats?.perCountry ?? []).slice(0, 10).map((r) => ({
                    name: countryName(r.countryCode),
                    count: r.count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                {t("핫한 포럼 (최근 7일 댓글 활동)", "Hot posts (recent activity)")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {forumStats?.hot.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  {t("최근 활동이 없습니다.", "No recent activity.")}
                </div>
              ) : (
                <div className="space-y-2">
                  {forumStats?.hot.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-background/40 border border-border/50"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {countryName(p.countryCode)} · {p.author}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-orange-400 tabular-nums">
                        +{p.recentActivity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-base">
              {t("국가별 활동 표", "Country activity table")}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border/50">
                  <th className="py-2 pr-3">{t("국가", "Country")}</th>
                  <th className="py-2 pr-3 text-right">{t("글", "Posts")}</th>
                  <th className="py-2 pr-3 text-right">{t("유저", "Users")}</th>
                  <th className="py-2 text-right">{t("이슈", "Issues")}</th>
                </tr>
              </thead>
              <tbody>
                {(countryStats ?? []).map((r) => (
                  <tr key={r.countryCode} className="border-b border-border/30">
                    <td className="py-2 pr-3">{countryName(r.countryCode)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.posts}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.users}</td>
                    <td className="py-2 text-right tabular-nums">{r.issues}</td>
                  </tr>
                ))}
                {(countryStats ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      {t("데이터 없음", "No data")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
