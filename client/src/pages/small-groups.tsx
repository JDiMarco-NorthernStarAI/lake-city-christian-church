import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { usePageContent } from "@/hooks/use-page-content";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, CheckCircle } from "lucide-react";

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

const expectations = [
  "Groups meet for 6-8 week sessions.",
  "Gatherings are held in homes or at various locations locally in the Middleburg Heights & Strongsville area.",
  "Groups share in a time of devotion, reflection, teaching and discipling, share meals and participate in local outreach activities \u2014 Together.",
];

export default function SmallGroups() {
  const c = usePageContent("small-groups", {
    hero_title: "City Small Groups",
    intro_text: "Small group gatherings exist as a way for people to engage in community and develop a closer relationship with Jesus.",
    cta_heading: "Find Your Group",
    cta_description: "Take the next step and connect with a small group near you.",
  });
  return (
    <div className="min-h-screen">
      <section className="relative flex items-center justify-center min-h-[60vh] bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
        <div className="relative z-10 text-center px-4 py-20">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-groups-hero-title"
          >
            {c.hero_title}
          </motion.h1>
          <motion.div
            className="w-16 h-1 mx-auto rounded-full"
            style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </div>
      </section>

      <section className="py-20 md:py-24 px-4">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <Users className="w-10 h-10 text-blue-500 mx-auto mb-6" />
          <p className="text-muted-foreground text-lg leading-relaxed" data-testid="text-groups-body">
            {c.intro_text}
          </p>
        </FadeInSection>
      </section>

      <section className="py-20 md:py-24 px-4 bg-background">
        <FadeInSection className="max-w-3xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-groups-expect"
          >
            What to Expect
          </h2>
          <div className="space-y-4">
            {expectations.map((item, index) => (
              <FadeInSection key={index} delay={index * 0.1}>
                <Card data-testid={`card-expect-${index}`}>
                  <CardContent className="flex items-start gap-4 p-6">
                    <CheckCircle className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
                    <p className="text-foreground leading-relaxed">{item}</p>
                  </CardContent>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </FadeInSection>
      </section>

      <section className="py-20 md:py-24 px-4">
        <FadeInSection className="max-w-xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground mb-6"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-groups-cta"
          >
            {c.cta_heading}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            {c.cta_description}
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="text-white border-transparent"
              style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
              data-testid="button-groups-join"
            >
              Join a Small Group
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </FadeInSection>
      </section>
    </div>
  );
}