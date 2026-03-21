import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";
import { usePageContent } from "@/hooks/use-page-content";

function getImageSrc(path: string | null | undefined) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/objects/")) return path;
  return `/objects${path.startsWith("/") ? path : `/${path}`}`;
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

export default function Announcements() {
  const c = usePageContent("announcements", {
    hero_title: "What's Happening?",
  });

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const upcoming = events?.filter((e) => e.isUpcoming) || [];

  return (
    <div className="min-h-screen bg-black">
      <section className="relative flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-neutral-950" />
        <div className="relative z-10 text-center px-4 py-24 md:py-32">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-wide"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-announcements-hero-title"
          >
            {c.hero_title}
          </motion.h1>
          <motion.div
            className="w-12 h-0.5 mx-auto bg-white/40"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </div>
      </section>

      <section className="bg-black py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <Card key={i} className="bg-neutral-900 border-neutral-800 overflow-visible">
                  <CardContent className="p-0">
                    <Skeleton className="w-full aspect-[4/3] bg-neutral-800" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-4 w-40 bg-neutral-800" />
                      <Skeleton className="h-5 w-32 bg-neutral-800" />
                      <Skeleton className="h-16 w-full bg-neutral-800" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-20" data-testid="text-empty-state">
              <Calendar className="w-16 h-16 text-white/20 mx-auto mb-6" />
              <p className="text-white/50 text-xl mb-2">No announcements right now</p>
              <p className="text-white/30 text-sm">Check back soon for updates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((event, i) => (
                <FadeInSection key={event.id} delay={i * 0.1}>
                  <Card
                    className="bg-neutral-900 border-neutral-800 overflow-visible h-full"
                    data-testid={`card-event-${event.id}`}
                  >
                    <CardContent className="p-0 flex flex-col h-full">
                      {event.imageUrl ? (
                        <div className="w-full aspect-[4/3] overflow-hidden rounded-t-md">
                          <img
                            src={getImageSrc(event.imageUrl)}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            data-testid={`img-event-${event.id}`}
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-[4/3] overflow-hidden rounded-t-md bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-white/10" />
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <p
                          className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-1.5"
                          data-testid={`text-event-date-${event.id}`}
                        >
                          {event.date}
                        </p>
                        <h3
                          className="text-base font-bold text-white mb-0.5"
                          style={{ fontFamily: "Montserrat, sans-serif" }}
                          data-testid={`text-event-title-${event.id}`}
                        >
                          {event.title}
                        </h3>
                        {event.subtitle && (
                          <p className="text-sm text-white/60 mb-3" data-testid={`text-event-subtitle-${event.id}`}>
                            {event.subtitle}
                          </p>
                        )}
                        <p className="text-white/40 text-sm leading-relaxed mt-auto" data-testid={`text-event-body-${event.id}`}>
                          {event.body}
                        </p>
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
