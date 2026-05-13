import React, { useState, useEffect } from "react";
import {
  useAdminListForumPosts,
  useAdminGetForumPost,
  useAdminDeleteForumPost,
  useAdminDeleteForumReply,
  getAdminListForumPostsQueryKey,
  getAdminGetForumPostQueryKey,
} from "@workspace/api-client-react";
import { useLocationOptions } from "@/lib/locations";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/language";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminForum() {
  const { t, language } = useLanguage();
  const qc = useQueryClient();
  const { all: locations, byCode } = useLocationOptions();
  const [country, setCountry] = useState<string>("");
  const [author, setAuthor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const queryParams: {
    country?: string;
    author?: string;
    from?: string;
    to?: string;
  } = {};
  if (country) queryParams.country = country;
  if (author.trim()) queryParams.author = author.trim();
  if (from) queryParams.from = new Date(`${from}T00:00:00.000Z`).toISOString();
  if (to) queryParams.to = new Date(`${to}T23:59:59.999Z`).toISOString();

  const { data: posts, isLoading } = useAdminListForumPosts(queryParams);

  const initialPostId = (() => {
    if (typeof window === "undefined") return null;
    const sp = new URLSearchParams(window.location.search);
    return sp.get("postId");
  })();

  const [selectedPostId, setSelectedPostId] = useState<string | null>(initialPostId);
  useEffect(() => {
    if (initialPostId) setSelectedPostId(initialPostId);
  }, [initialPostId]);

  const { data: postDetail } = useAdminGetForumPost(selectedPostId ?? "", {
    query: {
      enabled: !!selectedPostId,
      queryKey: getAdminGetForumPostQueryKey(selectedPostId ?? ""),
    },
  });

  const deletePost = useAdminDeleteForumPost();
  const deleteReply = useAdminDeleteForumReply();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getAdminListForumPostsQueryKey(queryParams) });
    if (selectedPostId)
      qc.invalidateQueries({ queryKey: getAdminGetForumPostQueryKey(selectedPostId) });
    qc.invalidateQueries({ queryKey: ["/forum/posts"] });
  };

  const countryName = (code: string) => {
    const c = byCode.get(code.toUpperCase());
    if (!c) return code;
    return `${c.flag} ${language === "ko" ? c.nameKo : c.name}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("포럼 관리", "Forum")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "글을 필터링하고 부적절한 게시물 또는 댓글을 삭제합니다.",
              "Filter posts and remove inappropriate posts or comments.",
            )}
          </p>
        </div>

        <Card className="bg-card/50 backdrop-blur border-border">
          <CardContent className="p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 block">
                {t("국가", "Country")}
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-md h-9 px-3 text-sm"
              >
                <option value="">{t("전체", "All")}</option>
                {locations.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {language === "ko" ? c.nameKo : c.name}
                    {c.planet !== "earth"
                      ? ` · ${language === "ko" ? c.groupLabelKo : c.groupLabel}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 block">
                {t("작성자", "Author")}
              </label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="bg-background/50 h-9"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 block">
                {t("기간 시작", "From")}
              </label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-background/50 h-9"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 block">
                {t("기간 종료", "To")}
              </label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-background/50 h-9"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-base">
                {t("글 목록", "Posts")} · {posts?.length ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  {t("불러오는 중...", "Loading...")}
                </div>
              ) : posts?.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  {t("글이 없습니다.", "No posts.")}
                </div>
              ) : (
                posts?.map((p) => (
                  <div
                    key={p.id}
                    className={`px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                      selectedPostId === p.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-background/40 hover:border-primary/50"
                    } ${p.deleted ? "opacity-50" : ""}`}
                    onClick={() => setSelectedPostId(p.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate flex items-center gap-2">
                          {p.title}
                          {p.deleted && (
                            <Badge variant="destructive" className="text-[9px]">
                              {t("삭제됨", "deleted")}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {countryName(p.countryCode)} · {p.author} ·{" "}
                          {format(new Date(p.createdAt), "yyyy-MM-dd")} · {p.replyCount}{" "}
                          {t("댓글", "comments")}
                        </div>
                      </div>
                      {!p.deleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!confirm(t("이 글을 삭제할까요?", "Delete this post?"))) return;
                            deletePost.mutate(
                              { id: p.id },
                              { onSuccess: invalidate },
                            );
                          }}
                          className="text-destructive hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-base">
                {selectedPostId ? t("글 상세", "Post detail") : t("글을 선택하세요", "Select a post")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedPostId ? (
                <div className="text-sm text-muted-foreground py-10 text-center">
                  {t("왼쪽에서 글을 클릭하세요.", "Click a post on the left.")}
                </div>
              ) : !postDetail ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  {t("불러오는 중...", "Loading...")}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">
                      {countryName(postDetail.post.countryCode)} · {postDetail.post.author} ·{" "}
                      {format(new Date(postDetail.post.createdAt), "yyyy-MM-dd HH:mm")}
                    </div>
                    <div className="text-lg font-bold">
                      {postDetail.post.title}
                      {postDetail.post.deleted && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">
                          {t("삭제됨", "deleted")}
                        </Badge>
                      )}
                    </div>
                    {postDetail.post.body && (
                      <div className="text-sm whitespace-pre-wrap mt-2 text-foreground/85">
                        {postDetail.post.body}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border/40 pt-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                      {t("댓글", "Comments")} · {postDetail.comments.length}
                    </div>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                      {postDetail.comments.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-3 text-center">
                          {t("댓글이 없습니다.", "No comments.")}
                        </div>
                      ) : (
                        postDetail.comments.map((c) => (
                          <div
                            key={c.id}
                            className={`px-3 py-2 rounded-md bg-background/40 border border-border/50 ${
                              c.deleted ? "opacity-50" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] text-muted-foreground mb-0.5">
                                  {c.author} · {format(new Date(c.createdAt), "yyyy-MM-dd HH:mm")}
                                  {c.deleted && (
                                    <span className="ml-2 text-destructive">
                                      [{t("삭제됨", "deleted")}]
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm whitespace-pre-wrap">{c.body}</div>
                              </div>
                              {!c.deleted && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (!confirm(t("이 댓글을 삭제할까요?", "Delete this comment?")))
                                      return;
                                    deleteReply.mutate(
                                      { id: c.id },
                                      { onSuccess: invalidate },
                                    );
                                  }}
                                  className="text-destructive hover:text-destructive flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
