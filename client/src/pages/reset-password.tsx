import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const { toast } = useToast();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await res.json();
      if (result.success) {
        setDone(true);
      } else {
        toast({ title: "Couldn't reset password", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
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
            <CardTitle className="text-2xl text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Choose a New Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle className="w-10 h-10 mx-auto text-green-400" />
                <p className="text-white/80 text-sm">Your password has been updated.</p>
                <Link href="/login" data-testid="link-login-after-reset">
                  <Button className="text-white border-transparent" style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}>
                    Sign In
                  </Button>
                </Link>
              </div>
            ) : !token ? (
              <div className="text-center space-y-4 py-4">
                <p className="text-white/80 text-sm">This reset link is missing or incomplete.</p>
                <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm">
                  Request a new link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-800 border-white/10 text-white"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    data-testid="input-new-password"
                  />
                  <p className="text-xs text-white/40">At least 8 characters.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-white/80">Confirm New Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="bg-zinc-800 border-white/10 text-white"
                    required
                    autoComplete="new-password"
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white border-transparent"
                  style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                  data-testid="button-reset-password"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
