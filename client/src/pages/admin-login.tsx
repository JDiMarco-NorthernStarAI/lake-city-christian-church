import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import whiteLogoPath from "@assets/White_Logo_1770933488639.png";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", data);
      const user = await res.json();
      toast({ title: "Welcome back", description: `Signed in as ${user.username}` });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/admin/dashboard");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4" data-testid="admin-login-page">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <img
            src={whiteLogoPath}
            alt="Lake City Christian Church"
            className="h-20 object-contain"
            data-testid="img-login-logo"
          />
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-login">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white/70 text-sm">Username</Label>
            <Input
              id="username"
              placeholder="Enter username"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              data-testid="input-username"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-red-400 text-xs" data-testid="text-username-error">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/70 text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              data-testid="input-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-red-400 text-xs" data-testid="text-password-error">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white"
            disabled={isLoading}
            data-testid="button-sign-in"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
