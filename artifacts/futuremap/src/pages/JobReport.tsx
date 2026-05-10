import React, { useState } from "react";
import { useLanguage } from "@/lib/language";
import { useListCountries, useAnalyzeJob, useListRecentJobReports } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Briefcase, Search, ShieldAlert, Cpu, Zap, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function JobReport() {
  const { t, language } = useLanguage();
  const [jobName, setJobName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  
  const { data: countries, isLoading: isLoadingCountries } = useListCountries();
  const { data: recentReports, isLoading: isLoadingRecent } = useListRecentJobReports({ limit: 6 });
  
  const analyzeJob = useAnalyzeJob();
  
  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName || !countryCode) return;
    
    analyzeJob.mutate({
      data: { jobName, countryCode }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col items-center text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/30">
          <Briefcase className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {t("AI 직업 미래 리포트", "AI Job Future Report")}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          {t("AI가 당신의 직업을 어떻게 변화시킬지 분석합니다.", "Analyze how AI will transform your career.")}
        </p>
      </div>

      <Card className="bg-card/50 backdrop-blur border-primary/20 shadow-[0_0_30px_rgba(8,145,178,0.1)] mb-12">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                className="pl-10 h-14 bg-background/50 border-primary/20 text-lg" 
                placeholder={t("직업을 입력하세요 (예: 회계사)", "Enter job title (e.g. Accountant)")}
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="h-14 bg-background/50 border-primary/20">
                  <SelectValue placeholder={t("국가 선택", "Select Country")} />
                </SelectTrigger>
                <SelectContent>
                  {countries?.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        {language === 'ko' ? c.nameKo : c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="h-14 px-8 text-lg font-bold" 
              disabled={analyzeJob.isPending || !jobName || !countryCode}
            >
              {analyzeJob.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t("분석 중...", "Analyzing...")}
                </>
              ) : t("분석하기", "Analyze")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {analyzeJob.isPending && (
        <div className="flex flex-col items-center justify-center py-20 text-primary">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-r-2 border-accent rounded-full animate-spin reverse"></div>
            <div className="absolute inset-4 border-b-2 border-primary/50 rounded-full animate-spin"></div>
            <Cpu className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-widest uppercase animate-pulse">
            {t("글로벌 데이터 처리 중...", "Processing Global Data...")}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t("산업 트렌드와 자동화 위험도를 계산하고 있습니다.", "Calculating industry trends and automation risks.")}
          </p>
        </div>
      )}

      {analyzeJob.isSuccess && analyzeJob.data && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="text-primary text-sm font-bold tracking-wider uppercase mb-2">
                {t("딥 분석 리포트", "Deep Analysis Report")}
              </div>
              <h2 className="text-3xl font-bold mb-4">{analyzeJob.data.jobName} in {analyzeJob.data.countryName}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {analyzeJob.data.summary}
              </p>
            </div>
            
            <div className="flex gap-4 shrink-0">
              <Card className="bg-destructive/10 border-destructive/20 w-40 flex flex-col items-center justify-center p-6 shrink-0">
                <span className="text-sm text-destructive-foreground/80 mb-2">{t("자동화 위험도", "Automation Risk")}</span>
                <span className="text-4xl font-mono text-destructive font-bold">{analyzeJob.data.automationRisk}%</span>
              </Card>
              <Card className="bg-primary/10 border-primary/20 w-40 flex flex-col items-center justify-center p-6 shrink-0">
                <span className="text-sm text-primary-foreground/80 mb-2">{t("성장 가능성", "Growth Score")}</span>
                <span className="text-4xl font-mono text-primary font-bold">{analyzeJob.data.growthScore}%</span>
              </Card>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-card/40 border-border">
              <CardContent className="p-6">
                <h3 className="flex items-center gap-2 font-bold text-destructive mb-4">
                  <Cpu className="w-5 h-5" />
                  {t("AI 대체 예상 업무", "Automated Tasks")}
                </h3>
                <ul className="space-y-2">
                  {analyzeJob.data.automatedTasks.map((task, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border">
              <CardContent className="p-6">
                <h3 className="flex items-center gap-2 font-bold text-accent mb-4">
                  <ShieldAlert className="w-5 h-5" />
                  {t("인간 고유의 강점", "Human Strengths")}
                </h3>
                <ul className="space-y-2">
                  {analyzeJob.data.humanStrengths.map((strength, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-accent mt-0.5">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border">
              <CardContent className="p-6">
                <h3 className="flex items-center gap-2 font-bold text-primary mb-4">
                  <Zap className="w-5 h-5" />
                  {t("미래 역할 변화", "Future Changes")}
                </h3>
                <ul className="space-y-2">
                  {analyzeJob.data.futureChanges.map((change, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
             <Card className="bg-card/40 border-border">
              <CardContent className="p-6">
                <h3 className="flex items-center gap-2 font-bold text-foreground mb-4">
                  <Star className="w-5 h-5 text-yellow-500" />
                  {t("추천 스킬", "Recommended Skills")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analyzeJob.data.recommendedSkills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full border border-border">
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border">
              <CardContent className="p-6">
                <h3 className="flex items-center gap-2 font-bold text-foreground mb-4">
                  <Globe2 className="w-5 h-5 text-primary" />
                  {t("국가 특화 기회", "Country Opportunities")}
                </h3>
                <ul className="space-y-2">
                  {analyzeJob.data.countryOpportunities.map((opp, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!analyzeJob.isPending && !analyzeJob.isSuccess && (
        <div>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {t("최근 생성된 리포트", "Recently generated")}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingRecent ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="h-32 bg-card/20 animate-pulse border-border" />
              ))
            ) : (
              recentReports?.map(report => (
                <Card 
                  key={report.id} 
                  className="bg-card/30 border-border hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => {
                    setJobName(report.jobName);
                    setCountryCode(report.countryCode);
                    analyzeJob.mutate({ data: { jobName: report.jobName, countryCode: report.countryCode } });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-lg group-hover:text-primary transition-colors">{report.jobName}</div>
                      <div className="text-sm font-medium px-2 py-0.5 bg-secondary rounded">{report.countryName}</div>
                    </div>
                    <div className="flex items-center gap-4 text-sm mt-4">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">{t("위험", "Risk")}</span>
                        <span className="text-destructive font-mono font-bold">{report.automationRisk}%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">{t("성장", "Growth")}</span>
                        <span className="text-primary font-mono font-bold">{report.growthScore}%</span>
                      </div>
                      <div className="ml-auto text-xs text-muted-foreground self-end">
                        {formatDistanceToNow(new Date(report.createdAt))} ago
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Globe2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}
