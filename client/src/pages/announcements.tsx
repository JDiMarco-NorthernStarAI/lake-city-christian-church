import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";

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

export default function Announcements() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const upcoming = events?.filter((e) => e.isUpcoming) || [];
  const past = events?.filter((e) => !e.isUpcoming) || [];
  const displayed = activeTab === "upcoming" ? upcoming : past;

  return (
    <div className="min-h-screen">
      <section className="relative flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/60" />
        <div className="relative z-10 text-center px-4 py-24 md:py-32">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-announcements-hero-title"
          >
            Announcements
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
          <div className="flex items-center justify-center gap-2 mb-12">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "upcoming"
                  ? "text-white"
                  : "bg-transparent text-muted-foreground"
              }`}
              style={
                activeTab === "upcoming"
                  ? { background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }
                  : undefined
              }
              data-testid="button-tab-upcoming"
            >
              Upcoming Events
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "past"
                  ? "text-white"
                  : "bg-transparent text-muted-foreground"
              }`}
              style={
                activeTab === "past"
                  ? { background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }
                  : undefined
              }
              data-testid="button-tab-past"
            >
              Past Events
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <Card key={i} className="overflow-visible">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center" data-testid="text-empty-state">
                  <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg mb-1">
                    {activeTab === "upcoming" ? "No upcoming events" : "No past events"}
                  </p>
                  <p className="text-muted-foreground/60 text-sm">Check back soon for updates.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {displayed.map((event, i) => (
                <FadeInSection key={event.id} delay={i * 0.05}>
                  <Card className="overflow-visible hover-elevate" data-testid={`card-event-${event.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {event.imageUrl && (
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full sm:w-32 h-24 object-cover rounded-md grayscale"
                          />
                        )}
                        <div className="flex-1">
                          <h3
                            className="text-lg font-bold text-foreground mb-1"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                            data-testid={`text-event-title-${event.id}`}
                          >
                            {event.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                          <p className="text-muted-foreground text-sm leading-relaxed">{event.body}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInSection>
              ))}
            </div>
          )}
        </FadeInSection>
      </section>
    </div>
  );
}
