import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAnalytics() {
  const [location] = useLocation();

  useEffect(() => {
    if (location.startsWith("/admin")) return;
    
    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: location }),
    }).catch(() => {});
  }, [location]);
}
