import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import muralImgPath from "@assets/LC_Mural_1770933498062.jpg";

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

export default function OurStory() {
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
            data-testid="text-our-story-hero-title"
          >
            Our Story
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
        <FadeInSection className="max-w-3xl mx-auto">
          <p className="text-lg leading-relaxed text-foreground mb-8">
            Two and a half decades of church leadership opened his eyes to the need for biblical ministry in today's world. After twenty-five years of leading churches large and small, Trevor transitioned into the role of Executive Director for the Kainos Leadership Network (formerly NOAH), a church planting organization in northeastern Ohio, and answered God's call to plant a highly intentional disciple-making church.
          </p>
          <p className="text-lg leading-relaxed text-foreground mb-8">
            After months of research, Godly counsel, prayer, fasting, and many late nights, the Littletons acknowledged a call to plant a church. Together with a launch team of mature Christians from various congregations in Northeastern Ohio, members of Kainos Leadership Network and Nexus Church Planting, Lake City Christian Church was born.
          </p>
        </FadeInSection>
      </section>

      <section className="bg-background py-20 md:py-24 px-4">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-kln-heading"
          >
            Kainos Leadership Network
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            KLN Exists to Plant and Equip Disciple Making Churches
          </p>
          <a
            href="https://thekln.org/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-kln-external"
          >
            <Button
              className="text-white border-transparent"
              style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
            >
              Visit KLN
              <ExternalLink className="w-4 h-4 ml-1" />
            </Button>
          </a>
        </FadeInSection>
      </section>

      <section className="relative py-20 md:py-24 px-4 overflow-hidden">
        <img
          src={muralImgPath}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-15 grayscale"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-white/80" />
        <FadeInSection className="relative z-10 max-w-3xl mx-auto">
          <div className="rounded-md overflow-hidden">
            <img
              src={muralImgPath}
              alt="Lake City Mural"
              className="w-full h-64 object-cover grayscale"
              data-testid="img-mural"
            />
          </div>
        </FadeInSection>
      </section>

      <section className="bg-black py-20 md:py-24 px-4">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-2"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-memorial-heading"
          >
            In Memory of Executive Pastor Joe Hoagland
          </h2>
          <p className="text-white/50 text-sm mb-8" style={{ fontFamily: "Montserrat, sans-serif" }}>
            2024
          </p>
          <p className="text-white/80 text-lg leading-relaxed">
            Joe was passionate about seeing people's lives changed for Jesus. Joe had served as the Associate Pastor for several churches in Ohio and was currently the Director of Operations for Kainos Leadership Network. Joe was an integral part of the Lake City Launch Team and will be missed beyond measure.
          </p>
        </FadeInSection>
      </section>

      <section className="bg-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
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
