import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Heart, Users, Play, ArrowUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import colorLogoPath from "@assets/color_Logo_1770933488638.png";
import welcomeImgPath from "@assets/LC_Welcome_Area_01_1770933498064.png";
import heroBackgroundPath from "@assets/Church_View_bw_1773518914154.png";
import easterBannerPath from "@assets/banner Easter.png";
import { useQuery } from "@tanstack/react-query";
import { usePageContent } from "@/hooks/use-page-content";

interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
}

function AnimatedCounter({ target, suffix = "+" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let current = 0;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    const interval = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <div ref={ref} className="text-center">
      <div
        className="text-5xl md:text-6xl font-bold"
        style={{
          fontFamily: "Montserrat, sans-serif",
          background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {count}{suffix}
      </div>
    </div>
  );
}

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

export default function Home() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { data: videos } = useQuery<YouTubeVideo[]>({ queryKey: ["/api/youtube/videos"] });
  const latestVideo = videos?.[0] ?? null;
  const c = usePageContent("home", {
    hero_title: "Lake City Christian Church",
    hero_tagline: "Connecting people to a life-changing relationship with Jesus.",
    service_time: "Sunday @ 10:00 AM",
    service_location: "6717 Fry Road, Middleburg Heights, OH",
    numbers_heading: "Lake City in Numbers",
    connect_heading: "Get Connected",
    connect_description: "We would love for you to be a part of what God is doing at Lake City.",
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const quickLinks = [
    {
      title: "I'm New",
      description: "Learn what to expect on your first visit.",
      icon: Heart,
      href: "/plan-visit",
    },
    {
      title: "Get Connected",
      description: "Find your place to serve and grow.",
      icon: Users,
      href: "/connect-serve",
    },
    {
      title: "Watch Sermons",
      description: "Catch up on recent messages.",
      icon: Play,
      href: "/encounter",
    },
  ];

  const stats = [
    { value: 30, label: "Baptisms", suffix: "+" },
    { value: 12, label: "Ministries", suffix: "+" },
    { value: 1, label: "Year Since Launch", suffix: "" },
    { value: 50, label: "Volunteers", suffix: "+" },
  ];

  return (
    <div className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center min-h-screen bg-black px-4 py-24 overflow-hidden -mt-[60px] md:-mt-[72px] pt-[84px] md:pt-[96px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBackgroundPath})` }}
          data-testid="img-hero-background"
        />
        <div className="absolute inset-0 bg-black/65" />
        <motion.img
          src={colorLogoPath}
          alt="Lake City Christian Church Logo"
          className="relative z-10 h-[200px] w-auto mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          data-testid="img-hero-logo"
        />

        <motion.h1
          className="relative z-10 text-4xl md:text-6xl font-bold text-white text-center mb-4"
          style={{ fontFamily: "Montserrat, sans-serif" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
          data-testid="text-hero-title"
        >
          {c.hero_title}
        </motion.h1>

        <motion.p
          className="relative z-10 text-lg md:text-xl text-white/70 text-center max-w-xl mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2.5 }}
          data-testid="text-hero-tagline"
        >
          {c.hero_tagline}
        </motion.p>

        <motion.div
          className="relative z-10 flex flex-col sm:flex-row items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 3 }}
        >
          <Link href="/plan-visit">
            <Button
              className="text-white border-transparent"
              style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
              data-testid="link-plan-visit-hero"
            >
              Plan Your Visit
            </Button>
          </Link>
          <Link href="/encounter">
            <Button
              variant="outline"
              className="text-white border-white/50 backdrop-blur-sm bg-white/5"
              data-testid="link-watch-online-hero"
            >
              Watch Online
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* SERVICE TIMES BAR */}
      <section className="bg-white py-6 px-4">
        <p className="text-center text-black" data-testid="text-service-times">
          <span className="font-bold" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700 }}>
            {c.service_time}
          </span>
          <span className="mx-2">|</span>
          <span>{c.service_location}</span>
          <span className="mx-2">|</span>
          <a href="tel:+12163954761" className="hover:text-blue-600 transition-colors">(216) 395-4761</a>
        </p>
      </section>

      {/* LAKE CITY IN NUMBERS */}
      <section className="bg-white py-20 md:py-24 px-4">
        <FadeInSection className="max-w-5xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-bold text-foreground mb-16"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-numbers-heading"
          >
            {c.numbers_heading}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                <p className="text-muted-foreground text-sm mt-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </FadeInSection>
      </section>

      {/* QUICK LINKS */}
      <section className="bg-background py-20 md:py-24 px-4">
        <FadeInSection className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickLinks.map((link) => (
              <Link key={link.title} href={link.href}>
                <Card
                  className="hover-elevate cursor-pointer h-full"
                  data-testid={`card-${link.title.toLowerCase().replace(/[^a-z]/g, "-")}`}
                >
                  <CardHeader>
                    <link.icon className="w-8 h-8 text-blue-500 mb-2" />
                    <CardTitle className="text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {link.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-muted-foreground text-sm">{link.description}</p>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </FadeInSection>
      </section>

      {/* EASTER WEEKEND BANNER */}
      <section className="bg-black py-0">
        <FadeInSection className="max-w-6xl mx-auto">
          <Link href="/events">
            <img
              src={easterBannerPath}
              alt="Easter Weekend - April 3rd, 4th & 5th 2026. Good Friday Service 6:00PM, Egg Hunt Saturday 1:00PM, Easter Sunday 10:00AM"
              className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            />
          </Link>
        </FadeInSection>
      </section>

      {/* RECENT SERMON */}
      <section className="bg-muted py-20 md:py-24 px-4">
        <FadeInSection className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-bold text-foreground mb-10"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-recent-sermon-heading"
          >
            Recent Message
          </h2>
          {latestVideo ? (
            <div className="aspect-video w-full rounded-md overflow-hidden mb-4">
              <iframe
                src={`https://www.youtube.com/embed/${latestVideo.id}`}
                title={latestVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                data-testid="iframe-recent-sermon"
              />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-md overflow-hidden mb-8 bg-muted flex items-center justify-center">
              <Play className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          {latestVideo && (
            <p className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: "Montserrat, sans-serif" }} data-testid="text-latest-sermon-title-home">
              {latestVideo.title}
            </p>
          )}
          <Link href="/encounter">
            <Button variant="outline" data-testid="link-see-all-sermons">
              See All Sermons
            </Button>
          </Link>
        </FadeInSection>
      </section>

      {/* CONNECT CARD CTA */}
      <section className="relative bg-black py-20 md:py-24 px-4 overflow-hidden">
        <img
          src={welcomeImgPath}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/60" />
        <FadeInSection className="relative z-10 max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-connect-heading"
          >
            {c.connect_heading}
          </h2>
          <p className="text-white/70 text-lg mb-8">
            {c.connect_description}
          </p>
          <Link href="/connect-serve">
            <Button
              className="text-white border-transparent"
              style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
              data-testid="link-connect-with-us"
            >
              Connect With Us
            </Button>
          </Link>
        </FadeInSection>
      </section>

      {/* BACK TO TOP */}
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-10 h-10 rounded-md text-white shadow-lg cursor-pointer"
          style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
          data-testid="button-back-to-top"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
}