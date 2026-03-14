import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

// Redirect /admin to /login for non-authenticated users,
// or /admin/dashboard for authenticated admins.
export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user && (user.roles?.includes("admin") || user.roles?.includes("super_admin"))) {
      setLocation("/admin/dashboard");
    } else {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}
