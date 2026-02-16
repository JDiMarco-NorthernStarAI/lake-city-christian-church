import { motion } from "framer-motion";
import { Link } from "wouter";
import { BookOpen, Heart, Users, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import serviceImgPath from "@assets/LC_Service_01_1770933498063.jpg";

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

const subPages = [
  {
    title: "Our Story",
    description: "Learn how Lake City Christian Church was born from a calling to plant a disciple-making church.",
    icon: BookOpen,
    href: "/our-story",
  },
  {
    title: "What We Believe",
    description: "Explore the core beliefs and convictions that guide everything we do.",
    icon: Heart,
    href: "/what-we-believe",
  },
  {
    title: "Leadership Team",
    description: "Meet the pastors and leaders serving our church community.",
    icon: Users,
    href: "/leadership",
  },
];

export default function About() {
  return (
    <div className="min-h-screen">
      <section className="relative flex items-center justify-center min-h-[60vh] bg-black overflow-hidden">
        <img
          src={serviceImgPath}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
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
            data-testid="text-about-hero-title"
          >
            About Us
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

      <section className="bg-white py-20 md:py-24 px-4">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground mb-6"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-about-mission"
          >
            Lake City Christian Church exists to connect people to a life-changing relationship with Jesus.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            We are a community of Christ-followers committed to making disciples, serving our neighbors, and growing together in faith. Whether you are exploring faith for the first time or looking for a church to call home, we would love to walk alongside you.
          </p>
        </FadeInSection>
      </section>

      <section className="bg-background py-20 md:py-24 px-4">
        <FadeInSection className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-about-learn-more"
          >
            Learn More About Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subPages.map((page, index) => (
              <FadeInSection key={page.title} delay={index * 0.1}>
                <Link href={page.href}>
                  <Card
                    className="hover-elevate cursor-pointer h-full"
                    data-testid={`card-about-${page.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <CardHeader>
                      <page.icon className="w-8 h-8 text-blue-500 mb-2" />
                      <CardTitle className="text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {page.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-muted-foreground text-sm">{page.description}</p>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </FadeInSection>
            ))}
          </div>
        </FadeInSection>
      </section>
    </div>
  );
}
