import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import SocialAuthButtons from "@/components/social-auth-buttons";

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    smsConsent: false,
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      zip: form.zip || undefined,
      smsConsent: form.smsConsent,
    });
    setLoading(false);
    if (result.success) {
      toast({ title: "Account created! Welcome to LC3." });
      navigate("/account");
    } else {
      toast({ title: "Registration failed", description: result.error, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-zinc-900 border-white/10">
          <CardHeader className="text-center">
            <CardTitle
              className="text-2xl text-white"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              data-testid="text-register-title"
            >
              Create Account
            </CardTitle>
            <p className="text-white/60 text-sm mt-1">
              Join the Lake City Christian Church community
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/80">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30"
                  data-testid="input-register-name"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-white/80">Email *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30"
                  data-testid="input-register-email"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white/80">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30"
                  data-testid="input-register-phone"
                  autoComplete="tel"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-white/80">Password *</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30"
                    data-testid="input-register-password"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-white/80">Confirm Password *</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30"
                    data-testid="input-register-confirm-password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-white/80">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30"
                  data-testid="input-register-address"
                  autoComplete="street-address"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-white/80">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30"
                    data-testid="input-register-city"
                    autoComplete="address-level2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-white/80">State</Label>
                  <Input
                    id="state"
                    placeholder="OH"
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                    className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30"
                    data-testid="input-register-state"
                    autoComplete="address-level1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip" className="text-white/80">ZIP</Label>
                  <Input
                    id="zip"
                    placeholder="44130"
                    value={form.zip}
                    onChange={(e) => update("zip", e.target.value)}
                    className="bg-zinc-800 border-white/10 text-white placeholder:text-white/30"
                    data-testid="input-register-zip"
                    autoComplete="postal-code"
                  />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="sms-consent"
                  checked={form.smsConsent}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, smsConsent: !!checked }))}
                  className="mt-0.5 border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  data-testid="checkbox-sms-consent"
                />
                <Label htmlFor="sms-consent" className="text-white/70 text-sm leading-snug cursor-pointer">
                  I agree to receive text messages from Lake City Christian Church at the phone number provided. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Consent is not required to attend or participate.{" "}
                  <Link href="/sms-terms" className="text-blue-400 hover:text-blue-300 underline" data-testid="link-sms-terms">
                    SMS Terms & Conditions
                  </Link>
                </Label>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white border-transparent"
                style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                data-testid="button-register-submit"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>
            <SocialAuthButtons mode="register" onSuccess={() => navigate("/account")} />
            <div className="mt-6 text-center">
              <p className="text-white/50 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300" data-testid="link-login">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
