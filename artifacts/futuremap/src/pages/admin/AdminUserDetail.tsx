import React from "react";
import { Link, useRoute } from "wouter";
import { useAdminGetUser } from "@workspace/api-client-react";
import { useLanguage } from "@/lib/language";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function AdminUserDetail() {
  const { t } = useLanguage();
  const [, params] = useRoute<{ wallet: string }>("/admin/users/:wallet");
  const wallet = params?.wallet ?? "";
  const { data, isLoading, error } = useAdminGetUser(wallet);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <Link href="/admin/users">
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
            <ArrowLeft className="w-3 h-3" />
            {t("유저 목록으로", "Back to users")}
          </div>
        </Link>

        {isLoading ? (
          <div className="text-muted-foreground text-sm">
            {t("불러오는 중...", "Loading...")}
          </div>
        ) : error || !data ? (
          <div className="text-destructive text-sm">
            {t("유저를 찾을 수 없습니다.", "User not found.")}
          </div>
        ) : (
          <>
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("프로필", "Profile")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <Field label={t("지갑 주소", "Wallet")} value={
                    <span className="font-mono text-xs break-all">{data.user.walletAddress}</span>
                  } />
                  <Field label={t("이름", "Display name")} value={data.user.displayName ?? "—"} />
                  <Field label={t("이메일", "Email")} value={data.user.email ?? "—"} />
                  <Field label={t("나이", "Age")} value={data.user.age ?? "—"} />
                  <Field label={t("성별", "Gender")} value={data.user.gender ?? "—"} />
                  <Field label={t("티어", "Tier")} value={
                    <Badge variant="secondary" className="capitalize">{data.user.tier}</Badge>
                  } />
                  <Field
                    label={t("가입일", "Joined")}
                    value={format(new Date(data.user.createdAt), "yyyy-MM-dd HH:mm")}
                  />
                  <Field
                    label={t("최근 로그인", "Last login")}
                    value={format(new Date(data.user.lastLoginAt), "yyyy-MM-dd HH:mm")}
                  />
                  <Field
                    label={t("상태", "Status")}
                    value={
                      data.user.deactivated ? (
                        <Badge variant="destructive">
                          {t("탈퇴", "Deactivated")}
                          {data.user.deactivatedAt
                            ? ` · ${format(new Date(data.user.deactivatedAt), "yyyy-MM-dd")}`
                            : ""}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{t("활성", "Active")}</Badge>
                      )
                    }
                  />
                </dl>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("작성한 글", "Posts")} · {data.posts.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.posts.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    {t("작성한 글이 없습니다.", "No posts.")}
                  </div>
                ) : (
                  data.posts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-background/40 border border-border/50"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {p.title}
                          {p.deleted && (
                            <span className="ml-2 text-[10px] text-destructive">
                              [{t("삭제됨", "deleted")}]
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.countryCode} · {format(new Date(p.createdAt), "yyyy-MM-dd")} ·{" "}
                          {p.replyCount} {t("댓글", "comments")}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("작성한 댓글", "Comments")} · {data.comments.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.comments.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    {t("작성한 댓글이 없습니다.", "No comments.")}
                  </div>
                ) : (
                  data.comments.map((c) => (
                    <div
                      key={c.id}
                      className="px-3 py-2 rounded-md bg-background/40 border border-border/50"
                    >
                      <div className="text-[11px] text-muted-foreground mb-1">
                        <Link href={`/admin/forum?postId=${c.postId}`}>
                          <span className="text-primary hover:underline cursor-pointer">
                            {c.postTitle}
                          </span>
                        </Link>{" "}
                        · {format(new Date(c.createdAt), "yyyy-MM-dd")}
                        {c.deleted && (
                          <span className="ml-2 text-destructive">
                            [{t("삭제됨", "deleted")}]
                          </span>
                        )}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{c.body}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}
