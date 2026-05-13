import React, { useState } from "react";
import { useLanguage } from "@/lib/language";
import {
  useAdminListCountryBanners,
  useAdminCreateCountryBanner,
  useAdminUpdateCountryBanner,
  useAdminDeleteCountryBanner,
  getAdminListCountryBannersQueryKey,
  type CountryBanner,
} from "@workspace/api-client-react";
import { useLocationOptions } from "@/lib/locations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Settings2, Trash2, Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Admin() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { data: banners } = useAdminListCountryBanners();
  const { all: locations, byCode } = useLocationOptions();
  const createBanner = useAdminCreateCountryBanner();
  const updateBanner = useAdminUpdateCountryBanner();
  const deleteBanner = useAdminDeleteCountryBanner();

  const [countryCode, setCountryCode] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getAdminListCountryBannersQueryKey(),
    });
    queryClient.invalidateQueries({ queryKey: ["/forum/banners"] });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryCode || !title || !imageUrl) return;
    createBanner.mutate(
      {
        data: {
          countryCode,
          title,
          subtitle: subtitle || undefined,
          imageUrl,
          linkUrl: linkUrl || undefined,
          active: true,
        },
      },
      {
        onSuccess: () => {
          setTitle("");
          setSubtitle("");
          setImageUrl("");
          setLinkUrl("");
          invalidate();
        },
      },
    );
  };

  const toggleActive = (b: CountryBanner) => {
    updateBanner.mutate(
      { id: b.id, data: { active: !b.active } },
      { onSuccess: invalidate },
    );
  };

  const remove = (b: CountryBanner) => {
    if (!confirm(t("이 배너를 삭제할까요?", "Delete this banner?"))) return;
    deleteBanner.mutate({ id: b.id }, { onSuccess: invalidate });
  };

  const grouped = (banners ?? []).reduce<Record<string, CountryBanner[]>>(
    (acc, b) => {
      (acc[b.countryCode] ||= []).push(b);
      return acc;
    },
    {},
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings2 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("관리자 · 국가별 배너 관리", "Admin · Country Banner Manager")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "포럼에서 국가 탭을 클릭했을 때 보여줄 배너를 관리합니다.",
              "Manage banners shown when a country tab is selected in the forum.",
            )}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Object.keys(grouped).length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
              {t("등록된 배너가 없습니다.", "No banners yet.")}
            </div>
          ) : (
            Object.entries(grouped).map(([code, list]) => {
              const country = byCode.get(code.toUpperCase());
              return (
                <div key={code}>
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                    <span className="text-base leading-none">
                      {country?.flag ?? "🏳️"}
                    </span>
                    <span>
                      {country
                        ? language === "ko"
                          ? country.nameKo
                          : country.name
                        : code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({list.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {list.map((b) => (
                      <Card
                        key={b.id}
                        className={`bg-card/50 border-border ${
                          !b.active ? "opacity-60" : ""
                        }`}
                      >
                        <CardContent className="p-4 flex gap-4">
                          <img
                            src={b.imageUrl}
                            alt={b.title}
                            className="w-32 h-20 object-cover rounded-md bg-secondary flex-shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.opacity =
                                "0.2";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold truncate">{b.title}</div>
                            {b.subtitle && (
                              <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {b.subtitle}
                              </div>
                            )}
                            {b.linkUrl && (
                              <a
                                href={b.linkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-primary hover:underline truncate block mt-1"
                              >
                                {b.linkUrl}
                              </a>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleActive(b)}
                              title={
                                b.active
                                  ? t("비활성화", "Deactivate")
                                  : t("활성화", "Activate")
                              }
                            >
                              {b.active ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => remove(b)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-secondary/30 border-border sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">
                {t("새 배너 등록", "New banner")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {t("국가", "Country")}
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-md h-9 px-3 text-sm"
                  >
                    <option value="">
                      {t("국가 선택...", "Select country...")}
                    </option>
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
                <Input
                  placeholder={t("제목", "Title")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background/50"
                />
                <Textarea
                  placeholder={t("부제 (선택)", "Subtitle (optional)")}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  rows={2}
                  className="bg-background/50 resize-none"
                />
                <Input
                  placeholder={t("이미지 URL", "Image URL")}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-background/50"
                />
                <Input
                  placeholder={t("연결 URL (선택)", "Link URL (optional)")}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="bg-background/50"
                />
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="w-full h-28 object-cover rounded-md border border-border"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    createBanner.isPending ||
                    !countryCode ||
                    !title ||
                    !imageUrl
                  }
                >
                  {createBanner.isPending
                    ? t("등록 중...", "Creating...")
                    : t("등록", "Create")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
