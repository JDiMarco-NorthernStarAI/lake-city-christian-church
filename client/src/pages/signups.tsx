import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Users, ClipboardList, ArrowRight } from "lucide-react";
import type { SignupEvent } from "@shared/schema";
import { SIGNUP_CATEGORY_LABELS } from "@shared/schema";
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

const FILTER_TABS: { key: string; label: string; categories: string[] }[] = [
  { key: "all", label: "All", categories: [] },
  { key: "event", label: "Events", categories: ["event"] },
  { key: "ministry", label: "Ministries", categories: ["kids_ministry", "student_ministry", "small_group", "fellowship"] },
  { key: "class", label: "Classes", categories: ["class"] },
  { key: "trip", label: "Trips", categories: ["trip"] },
  { key: "volunteer", label: "Volunteer", categories: ["volunteer"] },
  { key: "other", label: "Other", categories: ["other"] },
];

function getSpotsInfo(event: SignupEvent): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } | null {
  if (!event.maxSignups) return null;
  const remaining = event.maxSignups - event.currentSignupCount;
  if (remaining > 0) {
    return { text: `${remaining} spots left`, variant: "secondary" };
  }
  if (event.waitlistEnabled) {
    return { text: "Waitlist available", variant: "outline" };
  }
  return { text: "Full", variant: "destructive" };
}

function formatEventDate(dateStr: string | Date | null): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + "...";
}

// External sign-ups (Google Forms, etc.) that appear alongside database sign-ups
const EXTERNAL_SIGNUPS: { title: string; description: string; category: string; href: string }[] = [
  {
    title: "T-Shirt Sign Up",
    description: "Sign up to get your LC3 t-shirt! Fill out the form to reserve yours.",
    category: "other",
    href: "/tshirt-signup",
  },
];

export default function Signups() {
  const content = usePageContent("signups", {
    hero_title: "Sign Ups",
    hero_subtitle: "Browse and register for upcoming events, classes, and volunteer opportunities",
  });
  const [, navigate] = useLocation();
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: events, isLoading } = useQuery<SignupEvent[]>({
    queryKey: ["/api/public/signups"],
  });

  const activeTab = FILTER_TABS.find(t => t.key === activeFilter);
  const filtered = activeFilter === "all"
    ? events || []
    : (events || []).filter((e) => activeTab?.categories.includes(e.category));

  const filteredExternal = activeFilter === "all"
    ? EXTERNAL_SIGNUPS
    : EXTERNAL_SIGNUPS.filter((e) => activeTab?.categories.includes(e.category));

  return (
    <div className="min-h-screen bg-black pt-20">
      <section className="relative flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-neutral-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0033AA]/20 via-[#0088DD]/10 to-[#00D4FF]/20" />
        <div className="relative z-10 text-center px-4 py-24 md:py-32">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-wide"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-signups-hero-title"
          >
            {content.hero_title}
          </motion.h1>
          <motion.p
            className="text-lg text-gray-300 max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            data-testid="text-signups-hero-subtitle"
          >
            {content.hero_subtitle}
          </motion.p>
          <motion.div
            className="w-12 h-0.5 mx-auto bg-white/40"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          />
        </div>
      </section>

      <section className="bg-black py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="flex flex-wrap gap-2 mb-10 justify-center">
              {FILTER_TABS.map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeFilter === tab.key ? "default" : "outline"}
                  className={
                    activeFilter === tab.key
                      ? "bg-gradient-to-r from-[#0033AA] to-[#0088DD] border-[#0055CC] text-white"
                      : "border-neutral-700 text-neutral-400"
                  }
                  onClick={() => setActiveFilter(tab.key)}
                  data-testid={`button-filter-${tab.key}`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </FadeInSection>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="bg-neutral-900 border-neutral-800 overflow-visible">
                  <CardContent className="p-0">
                    <Skeleton className="w-full aspect-[4/3] bg-neutral-800" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-4 w-20 bg-neutral-800" />
                      <Skeleton className="h-5 w-40 bg-neutral-800" />
                      <Skeleton className="h-16 w-full bg-neutral-800" />
                      <Skeleton className="h-4 w-32 bg-neutral-800" />
                      <Skeleton className="h-9 w-full bg-neutral-800" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 && filteredExternal.length === 0 ? (
            <FadeInSection>
              <div className="text-center py-20" data-testid="text-empty-state">
                <ClipboardList className="w-16 h-16 text-white/20 mx-auto mb-6" />
                <p className="text-white/50 text-xl mb-2">No sign ups available right now</p>
                <p className="text-white/30 text-sm">Check back soon for new opportunities.</p>
              </div>
            </FadeInSection>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((event, i) => {
                const spotsInfo = getSpotsInfo(event);
                const formattedDate = formatEventDate(event.eventDate);
                const categoryLabel = SIGNUP_CATEGORY_LABELS[event.category] || event.category;

                return (
                  <FadeInSection key={event.id} delay={i * 0.08}>
                    <Card
                      className="bg-neutral-900 border-neutral-800 overflow-visible h-full"
                      data-testid={`card-signup-${event.id}`}
                    >
                      <CardContent className="p-0 flex flex-col h-full">
                        {event.imageUrl ? (
                          <div className="w-full aspect-[4/3] overflow-hidden rounded-t-md">
                            <img
                              src={event.imageUrl}
                              alt={event.title}
                              className="w-full h-full object-cover grayscale"
                              data-testid={`img-signup-${event.id}`}
                            />
                          </div>
                        ) : (
                          <div className="w-full aspect-[4/3] overflow-hidden rounded-t-md bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                            <ClipboardList className="w-12 h-12 text-white/10" />
                          </div>
                        )}

                        <div className="p-5 flex flex-col flex-1 gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${event.id}`}>
                              {categoryLabel}
                            </Badge>
                            {spotsInfo && (
                              <Badge variant={spotsInfo.variant} className="text-xs" data-testid={`badge-spots-${event.id}`}>
                                {spotsInfo.text}
                              </Badge>
                            )}
                          </div>

                          <h3
                            className="text-base font-bold text-white"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                            data-testid={`text-signup-title-${event.id}`}
                          >
                            {event.title}
                          </h3>

                          {event.description && (
                            <p
                              className="text-white/40 text-sm leading-relaxed"
                              data-testid={`text-signup-description-${event.id}`}
                            >
                              {truncateText(event.description, 120)}
                            </p>
                          )}

                          <div className="mt-auto space-y-2">
                            {formattedDate && (
                              <div className="flex items-center gap-2 text-white/50 text-sm" data-testid={`text-signup-date-${event.id}`}>
                                <Calendar className="w-4 h-4 shrink-0" />
                                <span>{formattedDate}</span>
                              </div>
                            )}

                            {event.location && (
                              <div className="flex items-center gap-2 text-white/50 text-sm" data-testid={`text-signup-location-${event.id}`}>
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span>{event.location}</span>
                              </div>
                            )}

                            {event.maxSignups && (
                              <div className="flex items-center gap-2 text-white/50 text-sm" data-testid={`text-signup-capacity-${event.id}`}>
                                <Users className="w-4 h-4 shrink-0" />
                                <span>{event.currentSignupCount} / {event.maxSignups} registered</span>
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full mt-2 bg-gradient-to-r from-[#0033AA] to-[#0088DD] border-[#0055CC]"
                            onClick={() => navigate(`/signups/${event.slug}`)}
                            data-testid={`button-signup-${event.id}`}
                          >
                            Sign Up
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeInSection>
                );
              })}
              {filteredExternal.map((ext, i) => (
                <FadeInSection key={`ext-${ext.href}`} delay={(filtered.length + i) * 0.08}>
                  <Card className="bg-neutral-900 border-neutral-800 overflow-visible h-full">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="w-full aspect-[4/3] overflow-hidden rounded-t-md bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                        <ClipboardList className="w-12 h-12 text-white/10" />
                      </div>
                      <div className="p-5 flex flex-col flex-1 gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {SIGNUP_CATEGORY_LABELS[ext.category] || ext.category}
                          </Badge>
                        </div>
                        <h3
                          className="text-base font-bold text-white"
                          style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                          {ext.title}
                        </h3>
                        <p className="text-white/40 text-sm leading-relaxed">
                          {ext.description}
                        </p>
                        <div className="mt-auto">
                          <Button
                            className="w-full mt-2 bg-gradient-to-r from-[#0033AA] to-[#0088DD] border-[#0055CC]"
                            onClick={() => navigate(ext.href)}
                          >
                            Sign Up
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInSection>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
