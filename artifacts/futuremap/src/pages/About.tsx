import React from "react";
import { useLanguage } from "@/lib/language";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
          {t("미래를 대비하는 글로벌 인사이트", "Global Insights for the Future")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("FutureMap AI는 전 세계의 이슈와 AI 기술 발전이 당신의 직업에 미칠 영향을 실시간으로 분석합니다.", 
             "FutureMap AI analyzes global issues and AI advancements in real-time to show how they will impact your career.")}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-24">
        {[
          {
            title: t("무료", "Free"),
            price: "$0",
            period: t("/월", "/mo"),
            features: [
              t("글로벌 이슈 지도 보기", "View Global Issue Map"),
              t("일 3회 AI 직업 분석", "3 AI Job Analyses/day"),
              t("포럼 읽기 전용", "Read-only Forum Access")
            ]
          },
          {
            title: "Pro",
            price: "$19",
            period: t("/월", "/mo"),
            highlight: true,
            features: [
              t("무제한 AI 직업 분석", "Unlimited AI Job Analyses"),
              t("심층 국가 리포트", "In-depth Country Reports"),
              t("포럼 글쓰기 및 토론", "Full Forum Access"),
              t("맞춤형 직업 추천", "Personalized Job Recommendations")
            ]
          },
          {
            title: "Enterprise",
            price: "$99",
            period: t("/월", "/mo"),
            features: [
              t("모든 Pro 기능", "All Pro Features"),
              t("API 액세스", "API Access"),
              t("팀 대시보드", "Team Dashboard"),
              t("전담 매니저 지원", "Dedicated Account Manager")
            ]
          }
        ].map((plan, i) => (
          <Card key={i} className={`relative bg-card/50 backdrop-blur-sm border ${plan.highlight ? 'border-primary shadow-[0_0_30px_rgba(8,145,178,0.2)]' : 'border-border'}`}>
            {plan.highlight && (
              <div className="absolute -top-3 inset-x-0 flex justify-center">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {t("추천", "Recommended")}
                </span>
              </div>
            )}
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground mb-1">{plan.period}</span>
              </div>
              <ul className="space-y-4">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className={`w-full mt-8 py-2.5 rounded-lg font-semibold transition-all ${
                plan.highlight 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}>
                {t("선택하기", "Choose Plan")}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
