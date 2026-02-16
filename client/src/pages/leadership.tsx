import { motion } from "framer-motion";
import { Link } from "wouter";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { TeamMember } from "@shared/schema";
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

export default function Leadership() {
  const c = usePageContent("leadership", {
    hero_title: "Leadership Team",
    intro_text: "",
  });

  const { data: members, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const featured = members?.find((m) => m.isFeatured);
  const team = members?.filter((m) => !m.isFeatured) || [];

  return (
    <div className="min-h-screen">
      <section className="relative flex items-center justify-center bg-black py-24 md:py-32 px-4">
        <div className="relative z-10 text-center">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-leadership-hero-title"
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

      <section className="bg-white py-20 md:py-24 px-4">
        <FadeInSection className="max-w-4xl mx-auto">
          {isLoading ? (
            <Card className="overflow-visible">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full shrink-0" />
                  <div className="flex-1 space-y-3 w-full">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : featured ? (
            <Card className="overflow-visible" data-testid="card-lead-pastor">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {featured.photoUrl ? (
                      <img src={featured.photoUrl} alt={featured.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-center md:text-left">
                    <h2
                      className="text-2xl md:text-3xl font-bold text-foreground mb-1"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      data-testid="text-lead-pastor-name"
                    >
                      {featured.name}
                    </h2>
                    <p
                      className="text-sm font-medium mb-4"
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                      data-testid="text-lead-pastor-role"
                    >
                      {featured.role}
                    </p>
                    {featured.bio && (
                      <p className="text-muted-foreground leading-relaxed">{featured.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </FadeInSection>
      </section>

      <section className="bg-background py-20 md:py-24 px-4">
        <FadeInSection className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-team-heading"
          >
            Our Team
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="overflow-visible">
                  <CardContent className="p-6 flex flex-col items-center">
                    <Skeleton className="w-20 h-20 rounded-full mb-4" />
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map((member, index) => (
                <FadeInSection key={member.id} delay={index * 0.08}>
                  <Card
                    className="hover-elevate overflow-visible"
                    data-testid={`card-team-member-${member.id}`}
                  >
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4 overflow-hidden">
                        {member.photoUrl ? (
                          <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <h3
                        className="text-lg font-bold text-foreground mb-1"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                        data-testid={`text-team-name-${member.id}`}
                      >
                        {member.name}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid={`text-team-role-${member.id}`}>
                        {member.role}
                      </p>
                    </CardContent>
                  </Card>
                </FadeInSection>
              ))}
            </div>
          )}
        </FadeInSection>
      </section>

      <section className="bg-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/about">
            <Button variant="ghost" data-testid="link-back-to-about">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to About Us
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
