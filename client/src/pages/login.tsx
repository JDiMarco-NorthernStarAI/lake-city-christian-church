import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Eye, EyeOff } from "lucide-react";
import SocialAuthButtons from "@/components/social-auth-buttons";
import { usePageContent } from "@/hooks/use-page-content";

export default function Login() {
  const content = usePageContent("login", {
    title: "Sign In",
    subtitle: "Welcome back to Lake City Christian Church",
  });
  const [, navigate] = useLocation();
  const { login, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect already-authenticated users
  useEffect(() => {
    if (authLoading || !user) return;
    const hasAdminRole = user.roles?.some((r: string) => r !== "member");
    if (hasAdminRole) {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      toast({ title: "Welcome back!" });
      // Check if user has admin role from the stored token
      const token = localStorage.getItem("lc3_access_token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const hasAdminRole = payload.roles?.some((r: string) => r !== "member");
          if (hasAdminRole) {
            navigate("/admin/dashboard");
            return;
          }
        } catch {}
      }
      navigate("/");
    } else {
      toast({ title: "Login failed", description: result.error, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="bg-zinc-900 border-white/10">
          <CardHeader className="text-center">
            <CardTitle
              className="text-2xl text-white"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              data-testid="text-login-title"
            >
              {content.title}
            </CardTitle>
            <p className="text-white/60 text-sm mt-1">
              {content.subtitle}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30"
                  data-testid="input-login-email"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30 pr-10"
                    data-testid="input-login-password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white border-transparent"
                style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                data-testid="button-login-submit"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
            <SocialAuthButtons mode="login" onSuccess={() => navigate("/")} />
            <div className="mt-6 text-center">
              <p className="text-white/50 text-sm">
                Don't have an account?{" "}
                <Link href="/register" className="text-blue-400 hover:text-blue-300" data-testid="link-register">
                  Create one
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
