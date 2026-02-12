import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

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

export default function Give() {
  return (
    <div className="min-h-screen">
      <section className="relative flex items-center justify-center min-h-[50vh] bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/60" />
        <div className="relative z-10 text-center px-4 py-20">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-give-hero-title"
          >
            Give
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-white/60 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            data-testid="text-give-hero-subtitle"
          >
            Reaching the local community and beyond.
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

      <section className="bg-white py-20 md:py-24 px-4">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <blockquote className="mb-12" data-testid="text-give-scripture">
            <p
              className="text-xl md:text-2xl text-foreground/80 italic leading-relaxed mb-6"
              style={{ fontFamily: "Georgia, serif" }}
            >
              "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver. And God is able to bless you abundantly, so that in all things at all times, having all you need, you will abound in every good work."
            </p>
            <cite className="text-muted-foreground text-base not-italic font-medium">
              — 2 Corinthians 9:7-8
            </cite>
          </blockquote>

          <div
            className="w-16 h-px mx-auto bg-border mb-12"
          />

          <a
            href="https://lake-city-christian-church-478123.churchcenter.com/giving"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-give-today"
          >
            <Button
              size="lg"
              className="text-white border-transparent text-lg px-10"
              style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
            >
              Give Today
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </FadeInSection>
      </section>
    </div>
  );
}
