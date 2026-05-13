import React, { useState } from "react";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useAuth, type Tier } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { shortAddress, WalletNotInstalledError } from "@/lib/wallet";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const TIER_STYLES: Record<Tier, string> = {
  free: "bg-secondary/70 text-muted-foreground border-border/60",
  pro: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
  enterprise: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40",
};

export function TierBadge({ tier }: { tier: Tier }) {
  const { t } = useLanguage();
  const label =
    tier === "free"
      ? t("무료", "Free")
      : tier === "pro"
        ? "Pro"
        : "Enterprise";
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${TIER_STYLES[tier]}`}
    >
      {label}
    </span>
  );
}

export default function WalletButton() {
  const { user, connect, logout } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const onConnect = async () => {
    setBusy(true);
    try {
      await connect();
      toast({
        title: t("지갑 연결됨", "Wallet connected"),
        description: t("이제 결제와 등급 업그레이드가 가능합니다.", "You can now subscribe and upgrade your tier."),
      });
    } catch (err) {
      // MetaMask only injects window.ethereum into top-level windows, not
      // into iframes (such as Replit's preview pane). When detection fails
      // inside an iframe we surface a much more useful hint than "install
      // MetaMask" — the user almost certainly already has it installed.
      const inIframe =
        typeof window !== "undefined" && window.top !== window.self;
      const msg =
        err instanceof WalletNotInstalledError
          ? inIframe
            ? t(
                "미리보기 창에서는 지갑이 감지되지 않습니다. 우측 상단의 ‘새 탭에서 열기’ 아이콘을 눌러 외부 탭에서 다시 시도해 주세요.",
                "Wallets are not exposed inside the preview pane. Open this app in a new tab (use the ↗ icon at the top right of the preview) and try again.",
              )
            : t(
                "EVM 지갑이 감지되지 않았습니다. MetaMask를 설치해 주세요.",
                "No EVM wallet detected. Please install MetaMask.",
              )
          : err instanceof Error && /User rejected/i.test(err.message)
            ? t("서명을 거절했습니다.", "Signature rejected.")
            : t("지갑 연결에 실패했습니다.", "Failed to connect wallet.");
      toast({ title: t("연결 실패", "Connection failed"), description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <button
        onClick={onConnect}
        disabled={busy}
        className="inline-flex items-center gap-2 px-3 h-8 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <Wallet className="w-3.5 h-3.5" />
        {busy ? t("연결 중…", "Connecting…") : t("지갑 연결", "Connect Wallet")}
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 pl-2 pr-2 h-8 rounded-full bg-secondary/70 border border-border/60 text-xs font-semibold hover:bg-secondary transition-colors">
          <TierBadge tier={user.tier} />
          <span className="font-mono text-white">{shortAddress(user.walletAddress)}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-mono text-xs">
          {shortAddress(user.walletAddress)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <span className="text-muted-foreground">{t("현재 등급", "Current tier")}</span>
          <span className="ml-auto"><TierBadge tier={user.tier} /></span>
        </DropdownMenuItem>
        {user.activeSubscription && (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground text-xs">
              {t("구독 상태", "Subscription")}
            </span>
            <span className="ml-auto text-xs">{user.activeSubscription.status}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()}>
          <LogOut className="w-4 h-4 mr-2" /> {t("로그아웃", "Sign out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
