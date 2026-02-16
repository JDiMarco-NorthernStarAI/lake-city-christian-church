import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "granted") {
      checkExistingSubscription();
      return;
    }
    if (Notification.permission === "denied") return;

    const dismissed = sessionStorage.getItem("lc3-notif-dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  async function checkExistingSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) setSubscribed(true);
    } catch {}
  }

  async function handleSubscribe() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShow(false);
        return;
      }

      let vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        try {
          const res = await fetch("/api/push/vapid-key");
          const data = await res.json();
          vapidKey = data.publicKey;
        } catch {}
      }
      if (!vapidKey) {
        setShow(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subJson = subscription.toJSON();
      await apiRequest("POST", "/api/push/subscribe", {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
      });

      setSubscribed(true);
      setShow(false);
    } catch (err) {
      console.error("Push subscription error:", err);
      setShow(false);
    }
  }

  function handleDismiss() {
    sessionStorage.setItem("lc3-notif-dismissed", "true");
    setShow(false);
  }

  if (!show || subscribed) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md"
      data-testid="notification-prompt"
    >
      <div className="rounded-md border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#00D4FF] to-[#0033AA]">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground" data-testid="text-notif-title">
              Stay Connected
            </p>
            <p className="mt-1 text-xs text-muted-foreground" data-testid="text-notif-body">
              Get notified about new sermons, events, and announcements from LC3.
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={handleSubscribe}
                data-testid="button-enable-notifications"
              >
                Enable Notifications
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                data-testid="button-dismiss-notifications"
              >
                Not Now
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleDismiss}
            data-testid="button-close-notif-prompt"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
