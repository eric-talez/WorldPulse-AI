import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminLogin,
  getAdminMeQueryKey,
} from "@workspace/api-client-react";
import { useLanguage } from "@/lib/language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function AdminLogin() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useAdminLogin();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    login.mutate(
      { data: { email, password } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getAdminMeQueryKey() });
          setLocation("/admin");
        },
        onError: () => {
          setError(t("이메일 또는 비밀번호가 올바르지 않습니다.", "Invalid email or password."));
        },
      },
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-card/70 backdrop-blur border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <CardTitle>{t("관리자 로그인", "Admin Sign In")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {t("이메일", "Email")}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {t("비밀번호", "Password")}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="text-xs text-destructive">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={login.isPending || !email || !password}
            >
              {login.isPending
                ? t("확인 중...", "Signing in...")
                : t("로그인", "Sign in")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
