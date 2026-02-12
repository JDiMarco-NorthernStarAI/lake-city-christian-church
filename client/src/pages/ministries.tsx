import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRight, Baby, GraduationCap, Users, HandHeart } from "lucide-react";

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

const ministries = [
  {
    title: "Lake City Kids",
    description: "A place where your child will feel comfortable, cared for and loved!",
    icon: Baby,
    href: "/kids-ministry",
  },
  {
    title: "Club 419 \u2014 Student Ministry",
    description: "Equipping students to follow Jesus and extend the good news.",
    icon: GraduationCap,
    href: "/student-ministry",
  },
  {
    title: "City Small Groups",
    description: "Small group gatherings for community and a closer relationship with Jesus.",
    icon: Users,
    href: "/small-groups",
  },
  {
    title: "Connect & Serve",
    description: "Find your place to serve and grow with us.",
    icon: HandHeart,
    href: "/connect-serve",
  },
];

export default function Ministries() {
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
            data-testid="text-ministries-hero-title"
          >
            Ministries
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
        <FadeInSection className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ministries.map((ministry, index) => (
              <FadeInSection key={ministry.title} delay={index * 0.1}>
                <Link href={ministry.href} data-testid={`link-ministry-${ministry.title.toLowerCase().replace(/[\s&]+/g, "-")}`}>
                  <Card
                    className="hover-elevate cursor-pointer h-full"
                    data-testid={`card-ministry-${ministry.title.toLowerCase().replace(/[\s&]+/g, "-")}`}
                  >
                    <CardHeader>
                      <ministry.icon className="w-8 h-8 text-blue-500 mb-2" />
                      <CardTitle className="text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {ministry.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{ministry.description}</p>
                      <div className="flex items-center gap-1 text-blue-500 text-sm font-medium">
                        <span>Learn More</span>
                        <ArrowRight className="w-4 h-4" />
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