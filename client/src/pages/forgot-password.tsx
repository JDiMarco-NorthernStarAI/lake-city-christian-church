import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailCheck } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // Same outcome either way — we never reveal whether the email exists
    } finally {
      setLoading(false);
      setSent(true);
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
              Reset Your Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4 py-4">
                <MailCheck className="w-10 h-10 mx-auto text-blue-400" />
                <p className="text-white/80 text-sm">
                  If that email has an account, a reset link is on its way. Check your inbox — the link works for 30 minutes.
                </p>
                <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm" data-testid="link-back-to-login">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-white/60 text-sm">
                  Enter the email on your account and we'll send you a link to choose a new password.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30"
                    required
                    autoComplete="email"
                    data-testid="input-forgot-email"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white border-transparent"
                  style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                  data-testid="button-send-reset"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Email Me a Reset Link"}
                </Button>
                <p className="text-center text-white/50 text-sm">
                  <Link href="/login" className="text-blue-400 hover:text-blue-300">Back to sign in</Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
