import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Palette, Baby, ArrowRight } from "lucide-react";
import { usePageContent } from "@/hooks/use-page-content";
import worshipImgPath from "@assets/LC_Worship_01_1770933498065.png";
import coffeeImgPath from "@assets/LC_Coffe_Shop_1770933498062.png";
import welcomeImgPath from "@assets/LC_Welcome_Area_02_1770933498065.jpg";

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

const expectItemsMeta = [
  { icon: Clock, title: "Service Time", key: "service_time" },
  { icon: MapPin, title: "Location", key: "location" },
  { icon: Palette, title: "What to Wear", key: "dress_code" },
  { icon: Baby, title: "Kids", key: "kids_info" },
];

export default function PlanVisit() {
  const c = usePageContent("plan-a-visit", {
    hero_title: "Plan Your Visit",
    hero_subtitle: "We'd love to meet you",
    service_time: "Sunday @ 10:00 AM",
    location: "6717 Fry Road, Middleburg Heights, OH",
    dress_code: "Come as you are — casual and comfortable.",
    kids_info: "Safe, fun programming for all ages during service.",
    cta_heading: "We Can't Wait to Meet You!",
    cta_description: "Have questions or want to learn more? We'd love to connect with you before your visit.",
  });

  return (
    <div className="min-h-screen">
      <section className="relative flex items-center justify-center min-h-[60vh] bg-black overflow-hidden">
        <img
          src={worshipImgPath}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
        <div className="relative z-10 text-center px-4 py-20">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-plan-visit-hero-title"
          >
            {c.hero_title}
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-white/60 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            data-testid="text-plan-visit-hero-subtitle"
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
        <FadeInSection className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-what-to-expect-heading"
          >
            What to Expect
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {expectItemsMeta.map((item, index) => (
              <FadeInSection key={item.title} delay={index * 0.1}>
                <Card className="text-center h-full" data-testid={`card-expect-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  <CardContent className="pt-8 pb-6">
                    <div
                      className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                    >
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3
                      className="text-lg font-bold text-foreground mb-2"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{c[item.key]}</p>
                  </CardContent>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </FadeInSection>
      </section>

      <section className="bg-background py-20 md:py-24 px-4">
        <FadeInSection className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-experience-heading"
          >
            Experience Lake City
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              className="overflow-hidden rounded-md"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={coffeeImgPath}
                alt="Lake City Coffee Shop"
                className="w-full h-64 md:h-80 object-cover grayscale"
                data-testid="img-coffee-shop"
              />
            </motion.div>
            <motion.div
              className="overflow-hidden rounded-md"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={welcomeImgPath}
                alt="Lake City Welcome Area"
                className="w-full h-64 md:h-80 object-cover grayscale"
                data-testid="img-welcome-area"
              />
            </motion.div>
          </div>
        </FadeInSection>
      </section>

      <section className="bg-white py-20 md:py-24 px-4">
        <FadeInSection className="max-w-4xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-find-us-heading"
          >
            Find Us
          </h2>
          <div
            className="w-full h-64 md:h-80 rounded-md bg-neutral-100 border border-neutral-200 flex flex-col items-center justify-center"
            data-testid="placeholder-map"
          >
            <MapPin className="w-10 h-10 text-neutral-400 mb-3" />
            <p className="text-foreground font-medium text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>
              6717 Fry Road
            </p>
            <p className="text-muted-foreground text-sm">Middleburg Heights, OH</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=6717+Fry+Road+Middleburg+Heights+OH"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-sm font-medium"
              style={{ color: "#0088DD" }}
              data-testid="link-get-directions"
            >
              Get Directions
            </a>
          </div>
        </FadeInSection>
      </section>

      <section className="bg-black py-20 md:py-24 px-4">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-cta-heading"
          >
            {c.cta_heading}
          </h2>
          <p className="text-white/70 text-lg mb-8">
            {c.cta_description}
          </p>
          <Link href="/connect-serve">
            <Button
              className="text-white border-transparent"
              style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
              data-testid="link-connect-with-us"
            >
              Connect With Us
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </FadeInSection>
      </section>
    </div>
  );
}
