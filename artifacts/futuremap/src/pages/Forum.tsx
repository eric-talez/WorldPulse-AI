import React, { useState } from "react";
import { useLanguage } from "@/lib/language";
import {
  useListForumPosts,
  useCreateForumPost,
  getListForumPostsQueryKey,
  useListForumReplies,
  useCreateForumReply,
  getListForumRepliesQueryKey,
  useListCountryBanners,
} from "@workspace/api-client-react";
import { useLocationOptions } from "@/lib/locations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageSquare, Globe2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function Forum() {
  const { t, language } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useListForumPosts({ country: selectedCountry });
  const { earthCountries, spaceLocations, byCode } = useLocationOptions();
  const createPost = useCreateForumPost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !selectedCountry) return;
    
    createPost.mutate({
      data: {
        countryCode: selectedCountry,
        author,
        title,
        body
      }
    }, {
      onSuccess: () => {
        setTitle("");
        setBody("");
        queryClient.invalidateQueries({ queryKey: getListForumPostsQueryKey({ country: selectedCountry }) });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">{t("글로벌 인사이트 포럼", "Global Insight Forum")}</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar border-b border-border">
        <button
          onClick={() => setSelectedCountry(undefined)}
          className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-colors border-b-2 ${
            !selectedCountry ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          🌐 {t("글로벌", "Global")}
        </button>
        {earthCountries.slice(0, 10).map(country => (
          <button
            key={country.code}
            onClick={() => setSelectedCountry(country.code)}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              selectedCountry === country.code ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{country.flag}</span>
            {language === 'ko' ? country.nameKo : country.name}
          </button>
        ))}
        {spaceLocations.length > 0 && (
          <div className="w-px self-stretch bg-border mx-1" aria-hidden />
        )}
        {spaceLocations.map(loc => (
          <button
            key={loc.code}
            onClick={() => setSelectedCountry(loc.code)}
            title={language === 'ko' ? loc.groupLabelKo : loc.groupLabel}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              selectedCountry === loc.code ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{loc.flag}</span>
            {language === 'ko' ? loc.nameKo : loc.name}
          </button>
        ))}
      </div>

      <CountryBanners countryCode={selectedCountry} />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              {t("불러오는 중...", "Loading...")}
            </div>
          ) : posts?.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
              {t("포스트가 없습니다.", "No posts found.")}
            </div>
          ) : (
            posts?.map(post => (
              <Card
                key={post.id}
                onClick={() => setSelectedPostId(post.id)}
                className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                  {post.body && <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{post.body}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground/80">
                      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px]">
                        {post.author.charAt(0).toUpperCase()}
                      </div>
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {post.replyCount} {t("답글", "replies")}
                    </span>
                    <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-secondary/30 backdrop-blur border-border sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">{t("새 포스트 작성", "Create New Post")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input 
                    placeholder={t("작성자명", "Author name")} 
                    value={author} 
                    onChange={e => setAuthor(e.target.value)} 
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Input 
                    placeholder={t("제목", "Title")} 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Textarea 
                    placeholder={t("내용을 입력하세요...", "What's on your mind?")} 
                    rows={5}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="bg-background/50 resize-none"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createPost.isPending || !title || !author || !selectedCountry}
                >
                  {createPost.isPending ? t("작성 중...", "Posting...") : t("등록하기", "Post")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={selectedPostId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPostId(null);
        }}
      >
        <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] overflow-y-auto">
          {selectedPostId && (() => {
            const post = posts?.find((p) => p.id === selectedPostId);
            if (!post) return null;
            const country = byCode.get(post.countryCode.toUpperCase());
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    {country && (
                      <span className="flex items-center gap-1">
                        <span className="text-base leading-none">{country.flag}</span>
                        {language === "ko" ? country.nameKo : country.name}
                      </span>
                    )}
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                  </div>
                  <DialogTitle className="text-2xl font-bold leading-tight">
                    {post.title}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {t("게시글 상세", "Post detail")}: {post.title}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 pt-1 -mt-2">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                    {post.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-foreground/90 font-medium">{post.author}</span>
                </div>
                <div className="mt-2">
                  {post.body ? (
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {post.body}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {t("내용 없음", "No content")}
                    </p>
                  )}
                </div>
                <PostReplies postId={post.id} replyCountFallback={post.replyCount} />
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CountryBanners({ countryCode }: { countryCode: string | undefined }) {
  const { data: banners } = useListCountryBanners(
    countryCode ? { country: countryCode } : undefined,
  );
  if (!banners || banners.length === 0) return null;
  return (
    <div className="mb-8 space-y-3">
      {banners.map((b) => {
        const inner = (
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card group">
            <img
              src={b.imageUrl}
              alt={b.title}
              className="w-full h-40 md:h-52 object-cover transition-transform group-hover:scale-[1.02]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5">
              <h3 className="text-white text-xl md:text-2xl font-bold drop-shadow">
                {b.title}
              </h3>
              {b.subtitle && (
                <p className="text-white/85 text-sm mt-1 max-w-xl">
                  {b.subtitle}
                </p>
              )}
            </div>
          </div>
        );
        return b.linkUrl ? (
          <a
            key={b.id}
            href={b.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            {inner}
          </a>
        ) : (
          <div key={b.id}>{inner}</div>
        );
      })}
    </div>
  );
}

interface ReplyNode {
  id: string;
  postId: string;
  parentReplyId?: string | null;
  author: string;
  body: string;
  createdAt: string;
  children: ReplyNode[];
}

function buildReplyTree(
  replies: Array<{
    id: string;
    postId: string;
    parentReplyId?: string | null;
    author: string;
    body: string;
    createdAt: string;
  }>,
): ReplyNode[] {
  const nodes = new Map<string, ReplyNode>();
  replies.forEach((r) => nodes.set(r.id, { ...r, children: [] }));
  const roots: ReplyNode[] = [];
  nodes.forEach((node) => {
    if (node.parentReplyId && nodes.has(node.parentReplyId)) {
      nodes.get(node.parentReplyId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function PostReplies({
  postId,
  replyCountFallback,
}: {
  postId: string;
  replyCountFallback: number;
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: replies, isLoading } = useListForumReplies(postId);
  const createReply = useCreateForumReply();
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const tree = buildReplyTree(replies ?? []);
  const total = replies?.length ?? replyCountFallback;

  const submit = (parentReplyId: string | null) => {
    if (!author.trim() || !body.trim()) return;
    createReply.mutate(
      {
        postId,
        data: {
          author: author.trim(),
          body: body.trim(),
          ...(parentReplyId ? { parentReplyId } : {}),
        },
      },
      {
        onSuccess: () => {
          setBody("");
          setReplyingTo(null);
          queryClient.invalidateQueries({
            queryKey: getListForumRepliesQueryKey(postId),
          });
          queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
        },
      },
    );
  };

  return (
    <div className="mt-6 pt-4 border-t border-border/50">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <MessageSquare className="w-3.5 h-3.5" />
        <span className="font-medium">
          {total} {t("답글", "replies")}
        </span>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-4">
          {t("불러오는 중...", "Loading...")}
        </div>
      ) : tree.length === 0 ? (
        <div className="text-xs text-muted-foreground py-2">
          {t("첫 댓글을 남겨주세요.", "Be the first to reply.")}
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          {tree.map((node) => (
            <ReplyItem
              key={node.id}
              node={node}
              depth={0}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              author={author}
              setAuthor={setAuthor}
              body={body}
              setBody={setBody}
              submit={submit}
              isPending={createReply.isPending}
            />
          ))}
        </div>
      )}

      {replyingTo === null && (
        <div className="space-y-2 pt-3 border-t border-border/30">
          <Input
            placeholder={t("작성자명", "Your name")}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="bg-background/50 h-8 text-sm"
          />
          <Textarea
            placeholder={t("댓글을 입력하세요...", "Write a reply...")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="bg-background/50 resize-none text-sm"
          />
          <Button
            size="sm"
            onClick={() => submit(null)}
            disabled={createReply.isPending || !author.trim() || !body.trim()}
          >
            {createReply.isPending
              ? t("작성 중...", "Posting...")
              : t("댓글 달기", "Post reply")}
          </Button>
        </div>
      )}
    </div>
  );
}

function ReplyItem({
  node,
  depth,
  replyingTo,
  setReplyingTo,
  author,
  setAuthor,
  body,
  setBody,
  submit,
  isPending,
}: {
  node: ReplyNode;
  depth: number;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  author: string;
  setAuthor: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  submit: (parentReplyId: string | null) => void;
  isPending: boolean;
}) {
  const { t } = useLanguage();
  const indent = Math.min(depth, 4) * 16;
  return (
    <div style={{ marginLeft: indent }}>
      <div className="bg-background/40 border border-border/50 rounded-md p-3">
        <div className="flex items-center gap-2 mb-1.5 text-xs">
          <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium">
            {node.author.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-foreground/90">{node.author}</span>
          <span className="text-muted-foreground">
            · {formatDistanceToNow(new Date(node.createdAt))} ago
          </span>
        </div>
        <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">
          {node.body}
        </p>
        <button
          onClick={() =>
            setReplyingTo(replyingTo === node.id ? null : node.id)
          }
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors mt-2"
        >
          {replyingTo === node.id ? t("취소", "Cancel") : t("답글", "Reply")}
        </button>
      </div>

      {replyingTo === node.id && (
        <div className="ml-4 mt-2 space-y-2">
          <Input
            placeholder={t("작성자명", "Your name")}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="bg-background/50 h-8 text-sm"
          />
          <Textarea
            placeholder={t("대댓글을 입력하세요...", "Write a nested reply...")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="bg-background/50 resize-none text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => submit(node.id)}
              disabled={isPending || !author.trim() || !body.trim()}
            >
              {isPending ? t("작성 중...", "Posting...") : t("등록", "Post")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
            >
              {t("취소", "Cancel")}
            </Button>
          </div>
        </div>
      )}

      {node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <ReplyItem
              key={child.id}
              node={child}
              depth={depth + 1}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              author={author}
              setAuthor={setAuthor}
              body={body}
              setBody={setBody}
              submit={submit}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
