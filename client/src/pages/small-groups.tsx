import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { usePageContent } from "@/hooks/use-page-content";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, CheckCircle, Clock } from "lucide-react";

interface PublicCityGroup {
  id: number;
  name: string;
  description: string | null;
  meetingDay: string | null;
  meetingTime: string | null;
}

// Staff sometimes leave placeholder values like "0.00" or blank — only show
// schedule parts that carry real information.
function groupSchedule(g: PublicCityGroup): string | null {
  const junk = new Set(["", "0", "0.00", "0:00", "00:00"]);
  const day = (g.meetingDay || "").trim();
  const time = (g.meetingTime || "").trim();
  const parts = [];
  if (day && !junk.has(day)) parts.push(day);
  if (time && !junk.has(time)) parts.push(time);
  return parts.length ? parts.join(" @ ") : null;
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

const expectations = [
  "Groups meet for 6-8 week sessions.",
  "Gatherings are held in homes or at various locations locally.",
  "Groups share in a time of devotion, reflection, teaching and discipling, share meals and participate in local outreach activities \u2014 Together.",
];

export default function SmallGroups() {
  const c = usePageContent("small-groups", {
    hero_title: "City Small Groups",
    intro_text: "Small group gatherings exist as a way for people to engage in community and develop a closer relationship with Jesus.",
    cta_heading: "Find Your Group",
    cta_description: "Take the next step and connect with a small group near you.",
    cta_button_text: "Join a Small Group",
    cta_button_url: "/join-small-group",
  });
  // The join button destination is editable in Admin > Page Content, so staff
  // can point it at a sign up (e.g. /signups/fall-groups) without a code change.
  const joinUrl = c.cta_button_url || "/join-small-group";
  const isInternal = joinUrl.startsWith("/");

  // Live list from Admin > Small Groups — edits there show up here instantly
  const { data: groups = [] } = useQuery<PublicCityGroup[]>({
    queryKey: ["/api/city-groups/active"],
    queryFn: async () => {
      const res = await fetch("/api/city-groups/active");
      if (!res.ok) return [];
      return res.json();
    },
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

      {groups.length > 0 && (
        <section className="py-20 md:py-24 px-4 bg-background">
          <FadeInSection className="max-w-4xl mx-auto">
            <h2
              className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              data-testid="text-groups-list-heading"
            >
              Our Groups
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((group, index) => {
                const schedule = groupSchedule(group);
                return (
                  <FadeInSection key={group.id} delay={index * 0.08}>
                    <Card className="h-full" data-testid={`card-group-${group.id}`}>
                      <CardContent className="p-6 flex flex-col gap-3 h-full">
                        <h3
                          className="text-lg font-bold text-foreground"
                          style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                          {group.name}
                        </h3>
                        {schedule && (
                          <div className="flex items-center gap-2 text-sm font-medium text-blue-500">
                            <Clock className="w-4 h-4 shrink-0" />
                            {schedule}
                          </div>
                        )}
                        {group.description && (
                          <p className="text-muted-foreground leading-relaxed text-sm">
                            {group.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </FadeInSection>
                );
              })}
            </div>
          </FadeInSection>
        </section>
      )}

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
          {isInternal ? (
            <Link href={joinUrl}>
              <Button
                size="lg"
                className="text-white border-transparent"
                style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                data-testid="button-groups-join"
              >
                {c.cta_button_text}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <a href={joinUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="text-white border-transparent"
                style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                data-testid="button-groups-join"
              >
                {c.cta_button_text}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          )}
        </FadeInSection>
      </section>
    </div>
  );
}