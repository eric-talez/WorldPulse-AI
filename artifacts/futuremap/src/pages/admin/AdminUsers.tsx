import React, { useState } from "react";
import { Link } from "wouter";
import { useAdminListUsers } from "@workspace/api-client-react";
import { useLanguage } from "@/lib/language";
import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function AdminUsers() {
  const { t } = useLanguage();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, isLoading } = useAdminListUsers({ search, page, pageSize });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("유저 관리", "Users")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "지갑·이메일·이름으로 검색하여 유저를 조회합니다.",
              "Search users by wallet, email, or display name.",
            )}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput.trim() || undefined);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("검색어", "Search...")}
              className="pl-9 bg-background/50"
            />
          </div>
          <Button type="submit" variant="secondary">
            {t("검색", "Search")}
          </Button>
        </form>

        <Card className="bg-card/50 backdrop-blur border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border/50">
                    <th className="py-3 px-4">{t("지갑", "Wallet")}</th>
                    <th className="py-3 px-4">{t("이름", "Name")}</th>
                    <th className="py-3 px-4">{t("티어", "Tier")}</th>
                    <th className="py-3 px-4">{t("가입일", "Joined")}</th>
                    <th className="py-3 px-4">{t("상태", "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        {t("불러오는 중...", "Loading...")}
                      </td>
                    </tr>
                  ) : data?.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        {t("유저가 없습니다.", "No users.")}
                      </td>
                    </tr>
                  ) : (
                    data?.items.map((u) => (
                      <tr
                        key={u.walletAddress}
                        className="border-b border-border/30 hover:bg-secondary/30"
                      >
                        <td className="py-3 px-4 font-mono text-xs">
                          <Link href={`/admin/users/${u.walletAddress}`}>
                            <span className="text-primary hover:underline cursor-pointer">
                              {u.walletAddress.slice(0, 6)}…{u.walletAddress.slice(-4)}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          {u.displayName ?? <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="capitalize">
                            {u.tier}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {format(new Date(u.createdAt), "yyyy-MM-dd")}
                        </td>
                        <td className="py-3 px-4">
                          {u.deactivated ? (
                            <Badge variant="destructive">{t("탈퇴", "Deactivated")}</Badge>
                          ) : (
                            <Badge variant="outline">{t("활성", "Active")}</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {t("총", "Total")} {data?.total ?? 0} ·{" "}
            {t("페이지", "Page")} {page} / {totalPages}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
