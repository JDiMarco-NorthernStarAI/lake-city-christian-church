import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Search, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Sermon } from "@shared/schema";

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

function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function getYouTubeThumbnail(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : "";
}

export default function Encounter() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: sermons, isLoading } = useQuery<Sermon[]>({
    queryKey: ["/api/sermons"],
  });

  const latestSermon = sermons?.[0];
  const pastSermons = sermons?.slice(1) || [];
  const filteredSermons = pastSermons.filter(
    (s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (s.series && s.series.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black">
      <section className="relative flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-neutral-950" />
        <div className="relative z-10 text-center px-4 py-24 md:py-32">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-encounter-hero-title"
          >
            Encounter
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-white/60 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            data-testid="text-encounter-hero-subtitle"
          >
            Watch & Listen
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

      <section className="bg-neutral-950 py-20 md:py-24 px-4">
        <FadeInSection className="max-w-4xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-8 text-center"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-latest-sermon-heading"
          >
            Latest Message
          </h2>
          {isLoading ? (
            <Skeleton className="aspect-video w-full rounded-md bg-neutral-800" />
          ) : latestSermon ? (
            <div>
              <div className="aspect-video w-full rounded-md overflow-hidden mb-4">
                <iframe
                  src={getYouTubeEmbedUrl(latestSermon.youtubeUrl)}
                  title={latestSermon.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  data-testid="iframe-latest-sermon"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "Montserrat, sans-serif" }} data-testid="text-latest-sermon-title">
                {latestSermon.title}
              </h3>
              <p className="text-white/50 text-sm mb-1">{new Date(latestSermon.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              {latestSermon.series && <p className="text-white/40 text-sm">Series: {latestSermon.series}</p>}
            </div>
          ) : (
            <div className="aspect-video w-full rounded-md bg-neutral-900 flex items-center justify-center border border-neutral-800">
              <div className="text-center">
                <Play className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/40 text-lg">No sermons yet</p>
              </div>
            </div>
          )}
          <div className="text-center mt-8">
            <a
              href="https://www.youtube.com/@LakeCityChristianChurch"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-watch-live"
            >
              <Button
                className="text-white border-transparent"
                style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
              >
                <Play className="w-4 h-4 mr-1" />
                Watch Live on YouTube
              </Button>
            </a>
          </div>
        </FadeInSection>
      </section>

      {(pastSermons.length > 0 || isLoading) && (
        <section className="bg-neutral-950 py-20 md:py-24 px-4 border-t border-neutral-800">
          <FadeInSection className="max-w-5xl mx-auto">
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-8 text-center"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              data-testid="text-past-sermons-heading"
            >
              Past Messages
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 max-w-xl mx-auto">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  placeholder="Search sermons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
                  data-testid="input-search-sermons"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSermons.map((sermon) => (
                <Card key={sermon.id} className="bg-neutral-900 border-neutral-800 hover-elevate overflow-visible" data-testid={`card-sermon-${sermon.id}`}>
                  <CardContent className="p-0">
                    <div className="aspect-video w-full overflow-hidden rounded-t-md">
                      <img
                        src={getYouTubeThumbnail(sermon.youtubeUrl)}
                        alt={sermon.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>{sermon.title}</h3>
                      <p className="text-white/50 text-sm">{new Date(sermon.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                      {sermon.series && <p className="text-white/40 text-xs mt-1">{sermon.series}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </FadeInSection>
        </section>
      )}
    </div>
  );
}
