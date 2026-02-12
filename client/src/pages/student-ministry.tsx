import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Clock, GraduationCap, UtensilsCrossed } from "lucide-react";

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

export default function StudentMinistry() {
  return (
    <div className="min-h-screen">
      <section className="relative flex items-center justify-center min-h-[60vh] bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
        <div className="relative z-10 text-center px-4 py-20">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-2"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-student-hero-title"
          >
            Club 419
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-white/80 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            data-testid="text-student-hero-subtitle"
          >
            Student Ministry
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

      <section className="py-20 md:py-24 px-4">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <GraduationCap className="w-10 h-10 text-blue-500 mx-auto mb-6" />
          <blockquote
            className="text-xl md:text-2xl font-medium italic text-foreground mb-8 leading-relaxed"
            data-testid="text-student-scripture"
          >
            "Come, follow me," Jesus said, "and I will send you out to fish for people."
            <span className="block text-base text-muted-foreground mt-2 not-italic">&mdash; Matthew 4:19</span>
          </blockquote>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Students have the ability to impact their schools, clubs, families, and other communities in a huge way. The purpose of Club 419 is to equip students to follow Jesus and extend the good news of a life-changing relationship with Jesus to the people they are surrounded by on a daily basis.
          </p>
        </FadeInSection>
      </section>

      <section className="py-20 md:py-24 px-4 bg-background">
        <FadeInSection className="max-w-2xl mx-auto">
          <Card data-testid="card-student-schedule">
            <CardHeader className="text-center">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <CardTitle style={{ fontFamily: "Montserrat, sans-serif" }}>
                When We Meet
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg font-semibold text-foreground" data-testid="text-student-schedule">
                Wednesday 6:30 PM - 8:00 PM
              </p>
            </CardContent>
          </Card>
        </FadeInSection>
      </section>

      <section className="py-20 md:py-24 px-4">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <UtensilsCrossed className="w-10 h-10 text-blue-500 mx-auto mb-6" />
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground mb-6"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-student-meal"
          >
            Meal Sponsorship
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Providing an opportunity for students to sit around the table and cultivate meaningful conversation and grow in friendship.
          </p>
        </FadeInSection>
      </section>

      <section className="py-20 md:py-24 px-4">
        <FadeInSection className="max-w-xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground mb-6"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-student-cta"
          >
            Get Involved
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            We would love for your student to be a part of Club 419.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="text-white border-transparent"
              style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
              data-testid="button-student-join"
            >
              Join Us
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </FadeInSection>
      </section>
    </div>
  );
}