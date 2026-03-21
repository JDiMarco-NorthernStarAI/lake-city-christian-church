import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ArrowRight, CreditCard, Building2, Smartphone } from "lucide-react";
import { usePageContent } from "@/hooks/use-page-content";

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

export default function Give() {
  const c = usePageContent("give", {
    hero_title: "Give",
    hero_subtitle: "Reaching the local community and beyond.",
    scripture_text: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver. And God is able to bless you abundantly, so that in all things at all times, having all you need, you will abound in every good work.",
    scripture_ref: "2 Corinthians 9:7-8",
  });

  useEffect(() => {
    // Load Planning Center Church Center modal script
    if (!document.querySelector('script[src="https://js.churchcenter.com/modal/v1"]')) {
      const script = document.createElement("script");
      script.src = "https://js.churchcenter.com/modal/v1";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

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
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Heart className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }} data-testid="text-donation-form-title">
                  Make a Donation
                </h2>
              </div>

              <p className="text-muted-foreground mb-8">
                Your generosity makes a difference in our community and beyond. Thank you for supporting the mission of Lake City Christian Church.
              </p>

              <a href="https://lakecitycc.churchcenter.com/giving?open-in-church-center-modal=true">
                <Button
                  size="lg"
                  className="w-full text-white border-transparent text-lg py-6"
                  style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                  data-testid="button-donate"
                >
                  Give Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-sm text-muted-foreground mb-4">Accepted payment methods</p>
                <div className="flex items-center justify-center gap-6 text-muted-foreground">
                  <div className="flex flex-col items-center gap-1">
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xs">Card</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Building2 className="w-6 h-6" />
                    <span className="text-xs">Bank</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Smartphone className="w-6 h-6" />
                    <span className="text-xs">Apple / Google Pay</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-6">
                Secure payment processed by Planning Center. Your donation may be tax-deductible.
              </p>
            </CardContent>
          </Card>
        </FadeInSection>
      </section>

    </div>
  );
}
