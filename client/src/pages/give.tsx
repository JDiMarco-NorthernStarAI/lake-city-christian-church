import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, RefreshCw, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { usePageContent } from "@/hooks/use-page-content";
import { useToast } from "@/hooks/use-toast";
import type { DonationFund } from "@shared/schema";

function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];

export default function Give() {
  const { toast } = useToast();
  const c = usePageContent("give", {
    hero_title: "Give",
    hero_subtitle: "Reaching the local community and beyond.",
    scripture_text: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver. And God is able to bless you abundantly, so that in all things at all times, having all you need, you will abound in every good work.",
    scripture_ref: "2 Corinthians 9:7-8",
  });

  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState<"one_time" | "weekly" | "monthly">("one_time");
  const [fundSlug, setFundSlug] = useState("general");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");

  const { data: funds = [] } = useQuery<DonationFund[]>({
    queryKey: ["/api/public/donation-funds"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: { amountCents: number; frequency: string; fundSlug: string; donorName?: string; donorEmail?: string }) => {
      const res = await apiRequest("POST", "/api/public/donations/create-checkout", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create checkout session. Please try again.", variant: "destructive" });
    },
  });

  const handleDonate = () => {
    const amount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0);
    if (!amount || amount < 1) {
      toast({ title: "Please enter an amount", description: "The minimum donation is $1.00", variant: "destructive" });
      return;
    }
    const amountCents = Math.round(amount * 100);
    checkoutMutation.mutate({
      amountCents,
      frequency,
      fundSlug,
      donorName: donorName || undefined,
      donorEmail: donorEmail || undefined,
    });
  };

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    if (value) {
      setSelectedAmount(null);
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const wasCancelled = urlParams.get("cancelled") === "true";

  return (
    <div className="min-h-screen">
      <section className="relative flex items-center justify-center min-h-[50vh] bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/60" />
        <div className="relative z-10 text-center px-4 py-20">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-give-hero-title"
          >
            {c.hero_title}
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-white/60 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            data-testid="text-give-hero-subtitle"
          >
            {c.hero_subtitle}
          </motion.p>
          <motion.div
            className="w-16 h-1 mx-auto rounded-full"
            style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          />
        </div>
      </section>

      <section className="bg-white py-20 md:py-24 px-4">
        <FadeInSection className="max-w-3xl mx-auto text-center mb-16">
          <blockquote data-testid="text-give-scripture">
            <p
              className="text-xl md:text-2xl text-foreground/80 italic leading-relaxed mb-6"
              style={{ fontFamily: "Georgia, serif" }}
            >
              "{c.scripture_text}"
            </p>
            <cite className="text-muted-foreground text-base not-italic font-medium">
              — {c.scripture_ref}
            </cite>
          </blockquote>
        </FadeInSection>

        <FadeInSection className="max-w-xl mx-auto" delay={0.2}>
          {wasCancelled && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-center text-amber-800" data-testid="text-cancelled-notice">
              Your donation was cancelled. You can try again below.
            </div>
          )}

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <Heart className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }} data-testid="text-donation-form-title">
                  Make a Donation
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-3 block">Select Amount</Label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {PRESET_AMOUNTS.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount ? "default" : "outline"}
                        className={selectedAmount === amount ? "text-white border-transparent" : ""}
                        style={selectedAmount === amount ? { background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" } : {}}
                        onClick={() => handlePresetClick(amount)}
                        data-testid={`button-amount-${amount}`}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className="pl-7"
                      data-testid="input-custom-amount"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Frequency</Label>
                  <div className="flex gap-2">
                    {([
                      { value: "one_time", label: "One Time", icon: Heart },
                      { value: "monthly", label: "Monthly", icon: RefreshCw },
                      { value: "weekly", label: "Weekly", icon: RefreshCw },
                    ] as const).map((opt) => (
                      <Button
                        key={opt.value}
                        variant={frequency === opt.value ? "default" : "outline"}
                        className={`flex-1 ${frequency === opt.value ? "text-white border-transparent" : ""}`}
                        style={frequency === opt.value ? { background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" } : {}}
                        onClick={() => setFrequency(opt.value)}
                        data-testid={`button-frequency-${opt.value}`}
                      >
                        <opt.icon className="w-4 h-4 mr-1" />
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {funds.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Designate Fund</Label>
                    <Select value={fundSlug} onValueChange={setFundSlug}>
                      <SelectTrigger data-testid="select-fund">
                        <SelectValue placeholder="Select a fund" />
                      </SelectTrigger>
                      <SelectContent>
                        {funds.map((fund) => (
                          <SelectItem key={fund.id} value={fund.slug} data-testid={`option-fund-${fund.slug}`}>
                            {fund.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Name (optional)</Label>
                    <Input
                      placeholder="Your name"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      data-testid="input-donor-name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Email (optional)</Label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      data-testid="input-donor-email"
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full text-white border-transparent text-lg"
                  style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                  onClick={handleDonate}
                  disabled={checkoutMutation.isPending}
                  data-testid="button-donate"
                >
                  {checkoutMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Give ${selectedAmount || customAmount || "0"}
                      {frequency !== "one_time" ? ` / ${frequency === "monthly" ? "month" : "week"}` : ""}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payment processed by Stripe. Your donation may be tax-deductible.
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeInSection>
      </section>
    </div>
  );
}
