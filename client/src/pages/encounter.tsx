import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Search, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
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

export default function Encounter() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const { data: videos, isLoading } = useQuery<YouTubeVideo[]>({
    queryKey: ["/api/youtube/videos"],
  });

  const latestVideo = videos?.[0] ?? null;
  const pastVideos = videos?.slice(1, 6) ?? [];
  const filteredPast = pastVideos.filter(
    (v) => v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeVideo = selectedVideo ?? latestVideo;

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
            {selectedVideo ? selectedVideo.title : "Latest Message"}
          </h2>
          {isLoading ? (
            <Skeleton className="aspect-video w-full rounded-md bg-neutral-800" />
          ) : activeVideo ? (
            <div>
              <div className="aspect-video w-full rounded-md overflow-hidden mb-4">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.id}`}
                  title={activeVideo.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  data-testid="iframe-latest-sermon"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "Montserrat, sans-serif" }} data-testid="text-latest-sermon-title">
                {activeVideo.title}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3.5 h-3.5 text-white/40" />
                <p className="text-white/50 text-sm">
                  {new Date(activeVideo.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              {activeVideo.description && (
                <p className="text-white/40 text-sm line-clamp-3">{activeVideo.description}</p>
              )}
            </div>
          ) : (
            <div className="aspect-video w-full rounded-md bg-neutral-900 flex items-center justify-center border border-neutral-800">
              <div className="text-center">
                <Play className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/40 text-lg">No videos found</p>
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

      {(pastVideos.length > 0 || isLoading) && (
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
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
                  data-testid="input-search-sermons"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-video w-full rounded-md bg-neutral-800" />
                  ))
                : filteredPast.map((video) => (
                    <Card
                      key={video.id}
                      className="bg-neutral-900 border-neutral-800 hover-elevate overflow-visible cursor-pointer"
                      onClick={() => {
                        setSelectedVideo(video);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      data-testid={`card-video-${video.id}`}
                    >
                      <CardContent className="p-0">
                        <div className="relative aspect-video w-full overflow-hidden rounded-t-md">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="w-10 h-10 text-white" />
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-white mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>{video.title}</h3>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-white/40" />
                            <p className="text-white/50 text-sm">
                              {new Date(video.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                          </div>
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
