import React, { useState } from "react";
import { useLanguage } from "@/lib/language";
import { useListForumPosts, useCreateForumPost, getListForumPostsQueryKey, useListCountries } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Globe2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function Forum() {
  const { t, language } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useListForumPosts({ country: selectedCountry });
  const { data: countries } = useListCountries();
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
        {countries?.slice(0, 10).map(country => (
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
      </div>

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
              <Card key={post.id} className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors cursor-pointer group">
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
    </div>
  );
}
