import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language";
import { useAuth, type Tier } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useGetPaymentsConfig,
  getGetPaymentsConfigQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

type PlanId = "pro" | "enterprise";
type Mode = "subscription" | "one_time";

interface CheckoutContext {
  plan: PlanId;
  mode: Mode;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = (await res.json()) as { error?: string };
      detail = data.error ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status} ${detail}`);
  }
  return (await res.json()) as T;
}

export default function About() {
  const { t } = useLanguage();
  const { user, connect, refresh } = useAuth();
  const { toast } = useToast();
  const { data: payCfg } = useGetPaymentsConfig({
    query: { staleTime: 60_000, queryKey: getGetPaymentsConfigQueryKey() },
  });
  const [checkout, setCheckout] = useState<CheckoutContext | null>(null);
  const [pickPlan, setPickPlan] = useState<PlanId | null>(null);

  // Confirm Stripe redirect on return.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("stripe_session_id");
    const status = params.get("stripe_status");
    if (!sessionId) return;
    // Strip query params from the URL.
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, "", cleanUrl);
    if (status === "cancelled") {
      toast({
        title: t("결제 취소됨", "Payment cancelled"),
        description: t("언제든 다시 시도할 수 있습니다.", "You can try again anytime."),
      });
      return;
    }
    void (async () => {
      try {
        const updated = await api<{ tier: Tier }>(
          `/api/payments/stripe/sessions/${encodeURIComponent(sessionId)}/confirm`,
          { method: "POST" },
        );
        await refresh();
        toast({
          title: t("결제 완료", "Payment complete"),
          description: t(
            `등급이 ${updated.tier.toUpperCase()}로 업그레이드되었습니다.`,
            `Your tier has been upgraded to ${updated.tier.toUpperCase()}.`,
          ),
        });
      } catch (err) {
        toast({
          title: t("결제 확인 실패", "Payment confirmation failed"),
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    })();
  }, [refresh, t, toast]);

  const handleChoose = async (plan: "free" | PlanId) => {
    if (plan === "free") {
      toast({
        title: t("무료 플랜 사용 중", "You're on Free"),
        description: t("기본 기능은 이미 모두 사용 가능합니다.", "All basic features are already available."),
      });
      return;
    }
    if (!user) {
      try {
        await connect();
      } catch {
        toast({
          title: t("지갑 연결 필요", "Wallet required"),
          description: t("결제하려면 지갑을 먼저 연결해 주세요.", "Connect your wallet first to subscribe."),
          variant: "destructive",
        });
        return;
      }
    }
    setPickPlan(plan);
  };

  const startCheckout = (mode: Mode) => {
    if (!pickPlan) return;
    setCheckout({ plan: pickPlan, mode });
    setPickPlan(null);
  };

  const onCheckoutSuccess = async (newTier: Tier) => {
    await refresh();
    setCheckout(null);
    toast({
      title: t("결제 완료", "Payment complete"),
      description: t(
        `등급이 ${newTier.toUpperCase()}로 업그레이드되었습니다.`,
        `Your tier has been upgraded to ${newTier.toUpperCase()}.`,
      ),
    });
  };

  const stripeAvailable = payCfg?.stripe?.available ?? false;
  const paypalAvailable = Boolean(payCfg?.paypal?.clientId);
  const planSubscriptionAvailable = useMemo(() => {
    if (!payCfg) {
      return {
        pro: { paypal: false, stripe: false },
        enterprise: { paypal: false, stripe: false },
      };
    }
    return {
      pro: {
        paypal: payCfg.paypal.plans.pro.hasSubscriptionPlan,
        stripe: payCfg.stripe.plans.pro.hasSubscriptionPlan,
      },
      enterprise: {
        paypal: payCfg.paypal.plans.enterprise.hasSubscriptionPlan,
        stripe: payCfg.stripe.plans.enterprise.hasSubscriptionPlan,
      },
    };
  }, [payCfg]);

  const subAvailableForPlan = (plan: PlanId): boolean => {
    const a = planSubscriptionAvailable[plan];
    return a.stripe || a.paypal;
  };

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
        {([
          {
            id: "free" as const,
            title: t("무료", "Free"),
            price: "$0",
            features: [
              t("글로벌 이슈 지도 보기", "View Global Issue Map"),
              t("일 3회 AI 직업 분석", "3 AI Job Analyses/day"),
              t("포럼 읽기 전용", "Read-only Forum Access"),
            ],
          },
          {
            id: "pro" as const,
            title: "Pro",
            price: "$19",
            highlight: true,
            features: [
              t("무제한 AI 직업 분석", "Unlimited AI Job Analyses"),
              t("심층 국가 리포트", "In-depth Country Reports"),
              t("포럼 글쓰기 및 토론", "Full Forum Access"),
              t("맞춤형 직업 추천", "Personalized Job Recommendations"),
            ],
          },
          {
            id: "enterprise" as const,
            title: "Enterprise",
            price: "$99",
            features: [
              t("모든 Pro 기능", "All Pro Features"),
              t("API 액세스", "API Access"),
              t("팀 대시보드", "Team Dashboard"),
              t("전담 매니저 지원", "Dedicated Account Manager"),
            ],
          },
        ]).map((plan) => {
          const isCurrent = user?.tier === plan.id;
          return (
            <Card
              key={plan.id}
              className={`relative bg-card/50 backdrop-blur-sm border ${plan.highlight ? "border-primary shadow-[0_0_30px_rgba(8,145,178,0.2)]" : "border-border"}`}
            >
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
                  <span className="text-muted-foreground mb-1">{t("/월", "/mo")}</span>
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
                <button
                  disabled={isCurrent}
                  onClick={() => void handleChoose(plan.id)}
                  className={`w-full mt-8 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-default ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {isCurrent
                    ? t("현재 플랜", "Current Plan")
                    : !user && plan.id !== "free"
                      ? t("지갑 연결 후 선택", "Connect Wallet to Choose")
                      : t("선택하기", "Choose Plan")}
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={pickPlan !== null} onOpenChange={(o) => !o && setPickPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pickPlan === "pro" ? "Pro" : "Enterprise"} — {t("결제 방식 선택", "Choose Payment Type")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "월 구독으로 자동 갱신하거나, 한 달 분을 1회만 결제할 수 있습니다.",
                "Subscribe monthly with auto-renewal, or pay once for a single month.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => startCheckout("subscription")}
              disabled={!!pickPlan && !subAvailableForPlan(pickPlan)}
              className="rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 p-4 text-left transition-colors disabled:opacity-50"
            >
              <div className="font-bold mb-1">{t("월 구독", "Monthly Subscription")}</div>
              <div className="text-xs text-muted-foreground">
                {!!pickPlan && subAvailableForPlan(pickPlan)
                  ? t("매달 자동 결제 · 언제든 취소", "Auto-billed monthly · cancel anytime")
                  : t("관리자가 구독 플랜을 등록해야 합니다", "Subscription plan not configured")}
              </div>
            </button>
            <button
              onClick={() => startCheckout("one_time")}
              className="rounded-xl border border-border bg-secondary/40 hover:bg-secondary/60 p-4 text-left transition-colors"
            >
              <div className="font-bold mb-1">{t("1회 결제", "One-time Payment")}</div>
              <div className="text-xs text-muted-foreground">
                {t("한 달치 1회 결제 · 자동 갱신 없음", "Pay once for one month · no renewal")}
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={checkout !== null} onOpenChange={(o) => !o && setCheckout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("결제 방법", "Payment Method")}</DialogTitle>
            <DialogDescription>
              {checkout && (
                checkout.mode === "subscription"
                  ? t("월 구독을 시작합니다.", "Start your monthly subscription.")
                  : t("1회 결제를 진행합니다.", "Make a one-time payment.")
              )}
            </DialogDescription>
          </DialogHeader>
          {checkout && (
            <div className="space-y-4 pt-2">
              {/* Primary: Stripe */}
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    try {
                      const successUrl = `${window.location.origin}${window.location.pathname}?stripe_session_id={CHECKOUT_SESSION_ID}&stripe_status=success`;
                      const cancelUrl = `${window.location.origin}${window.location.pathname}?stripe_status=cancelled`;
                      const res = await api<{ url: string }>("/api/payments/stripe/checkout", {
                        method: "POST",
                        body: JSON.stringify({
                          plan: checkout.plan,
                          mode: checkout.mode,
                          successUrl,
                          cancelUrl,
                        }),
                      });
                      window.location.href = res.url;
                    } catch (err) {
                      toast({
                        title: t("결제 실패", "Payment failed"),
                        description: (err as Error).message,
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={
                    !stripeAvailable ||
                    (checkout.mode === "subscription" && !planSubscriptionAvailable[checkout.plan].stripe)
                  }
                  className="w-full py-3 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("카드 / Apple Pay / Google Pay", "Pay with Card / Apple Pay / Google Pay")}
                </button>
                {!stripeAvailable && (
                  <p className="text-xs text-muted-foreground">
                    {t("Stripe가 아직 연결되지 않았습니다.", "Stripe is not connected yet.")}
                  </p>
                )}
                {stripeAvailable &&
                  checkout.mode === "subscription" &&
                  !planSubscriptionAvailable[checkout.plan].stripe && (
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "Stripe 구독 가격이 등록되어 있지 않습니다 (STRIPE_PRICE_ID).",
                        "Stripe subscription price ID is not configured.",
                      )}
                    </p>
                  )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t("또는", "or")}</span>
                </div>
              </div>

              {/* Secondary: PayPal */}
              {paypalAvailable && payCfg?.paypal?.clientId ? (
                (checkout.mode === "subscription" && !planSubscriptionAvailable[checkout.plan].paypal) ? (
                  <p className="text-xs text-muted-foreground text-center">
                    {t(
                      "PayPal 구독 플랜이 등록되어 있지 않습니다 (PAYPAL_PLAN_ID).",
                      "PayPal subscription plan ID is not configured.",
                    )}
                  </p>
                ) : (
                  <PaypalCheckout
                    clientId={payCfg.paypal.clientId}
                    env={payCfg.paypal.env}
                    plan={checkout.plan}
                    mode={checkout.mode}
                    onSuccess={onCheckoutSuccess}
                    onError={(msg) =>
                      toast({ title: t("결제 실패", "Payment failed"), description: msg, variant: "destructive" })
                    }
                    onCancel={() =>
                      toast({ title: t("결제 취소됨", "Payment cancelled"), description: t("언제든 다시 시도할 수 있습니다.", "You can try again anytime.") })
                    }
                  />
                )
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  {t("PayPal이 아직 연결되지 않았습니다.", "PayPal is not connected yet.")}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CheckoutProps {
  clientId: string;
  env: "sandbox" | "live";
  plan: PlanId;
  mode: Mode;
  onSuccess: (newTier: Tier) => Promise<void>;
  onError: (msg: string) => void;
  onCancel: () => void;
}

function PaypalCheckout({ clientId, plan, mode, onSuccess, onError, onCancel }: CheckoutProps) {
  const { t } = useLanguage();
  const isSubscription = mode === "subscription";
  const options = useMemo(
    () => ({
      clientId,
      currency: "USD",
      intent: isSubscription ? "subscription" : "capture",
      ...(isSubscription ? { vault: true } : {}),
    }),
    [clientId, isSubscription],
  );

  return (
    <div>
      <PayPalScriptProvider options={options}>
        {isSubscription ? (
          <PayPalButtons
            style={{ layout: "vertical", color: "blue", shape: "rect" }}
            createSubscription={async () => {
              const res = await api<{ subscriptionId: string }>("/api/payments/subscriptions", {
                method: "POST",
                body: JSON.stringify({ plan }),
              });
              return res.subscriptionId;
            }}
            onApprove={async (data) => {
              try {
                const updated = await api<{ tier: Tier }>(
                  `/api/payments/subscriptions/${data.subscriptionID}/activate`,
                  { method: "POST" },
                );
                await onSuccess(updated.tier);
              } catch (err) {
                onError((err as Error).message);
              }
            }}
            onCancel={() => onCancel()}
            onError={(err) => onError((err as unknown as Error)?.message ?? t("알 수 없는 오류", "Unknown error"))}
          />
        ) : (
          <PayPalButtons
            style={{ layout: "vertical", color: "blue", shape: "rect" }}
            createOrder={async () => {
              const res = await api<{ orderId: string }>("/api/payments/orders", {
                method: "POST",
                body: JSON.stringify({ plan }),
              });
              return res.orderId;
            }}
            onApprove={async (data) => {
              try {
                const updated = await api<{ tier: Tier }>(
                  `/api/payments/orders/${data.orderID}/capture`,
                  { method: "POST" },
                );
                await onSuccess(updated.tier);
              } catch (err) {
                onError((err as Error).message);
              }
            }}
            onCancel={() => onCancel()}
            onError={(err) => onError((err as unknown as Error)?.message ?? t("알 수 없는 오류", "Unknown error"))}
          />
        )}
      </PayPalScriptProvider>
    </div>
  );
}
