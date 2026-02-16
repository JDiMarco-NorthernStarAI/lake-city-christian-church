import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void;
        signIn: () => Promise<{
          authorization: { id_token: string; code: string };
          user?: { name?: { firstName?: string; lastName?: string }; email?: string };
        }>;
      };
    };
  }
}

interface SocialAuthButtonsProps {
  onSuccess: () => void;
  mode: "login" | "register";
}

interface AuthConfig {
  googleClientId: string | null;
  appleClientId: string | null;
}

export default function SocialAuthButtons({ onSuccess, mode }: SocialAuthButtonsProps) {
  const { socialLogin } = useAuth();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    fetch("/api/v1/auth/config")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setConfig(res.data);
      })
      .catch(() => {});
  }, []);

  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setGoogleLoading(true);
      const result = await socialLogin("google", response.credential);
      setGoogleLoading(false);
      if (result.success) {
        toast({ title: mode === "register" ? "Account created with Google!" : "Signed in with Google!" });
        onSuccess();
      } else {
        toast({ title: "Google sign-in failed", description: result.error, variant: "destructive" });
      }
    },
    [socialLogin, toast, onSuccess, mode]
  );

  useEffect(() => {
    if (!config?.googleClientId) return;

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript && window.google) {
      setGoogleReady(true);
      return;
    }

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleReady(true);
      document.head.appendChild(script);
    }
  }, [config?.googleClientId]);

  useEffect(() => {
    if (!googleReady || !config?.googleClientId || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: config.googleClientId,
      callback: handleGoogleResponse,
      auto_select: false,
    });
  }, [googleReady, config?.googleClientId, handleGoogleResponse]);

  function handleGoogleClick() {
    if (!window.google || !config?.googleClientId) return;

    const btn = document.createElement("div");
    btn.style.display = "none";
    document.body.appendChild(btn);
    window.google.accounts.id.renderButton(btn, {
      type: "standard",
      size: "large",
    });
    const innerBtn = btn.querySelector('[role="button"]') as HTMLElement;
    if (innerBtn) innerBtn.click();
    setTimeout(() => btn.remove(), 100);

    window.google.accounts.id.prompt();
  }

  async function handleAppleClick() {
    if (!config?.appleClientId) return;
    setAppleLoading(true);
    try {
      if (!window.AppleID) {
        const script = document.createElement("script");
        script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Apple SDK"));
          document.head.appendChild(script);
        });
      }

      window.AppleID!.auth.init({
        clientId: config.appleClientId,
        scope: "name email",
        redirectURI: window.location.origin + "/login",
        usePopup: true,
      });

      const response = await window.AppleID!.auth.signIn();
      const fullName = response.user?.name
        ? `${response.user.name.firstName || ""} ${response.user.name.lastName || ""}`.trim()
        : undefined;

      const result = await socialLogin("apple", response.authorization.id_token, fullName);
      if (result.success) {
        toast({ title: mode === "register" ? "Account created with Apple!" : "Signed in with Apple!" });
        onSuccess();
      } else {
        toast({ title: "Apple sign-in failed", description: result.error, variant: "destructive" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Apple sign-in was cancelled";
      if (!msg.includes("cancelled") && !msg.includes("popup_closed")) {
        toast({ title: "Apple sign-in failed", description: msg, variant: "destructive" });
      }
    } finally {
      setAppleLoading(false);
    }
  }

  const hasGoogle = !!config?.googleClientId;
  const hasApple = !!config?.appleClientId;
  if (!hasGoogle && !hasApple) return null;

  const actionText = mode === "register" ? "Sign up" : "Sign in";

  return (
    <div className="space-y-3">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-900 px-2 text-white/40">Or continue with</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {hasGoogle && (
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleClick}
            disabled={googleLoading || !googleReady}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 border-white/20"
            data-testid="button-google-signin"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {actionText} with Google
          </Button>
        )}
        {hasApple && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAppleClick}
            disabled={appleLoading}
            className="w-full bg-black hover:bg-zinc-800 text-white border-white/20"
            data-testid="button-apple-signin"
          >
            {appleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            )}
            {actionText} with Apple
          </Button>
        )}
      </div>
    </div>
  );
}
