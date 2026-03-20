import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { usePageContent } from "@/hooks/use-page-content";
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
  const c = usePageContent("our-story", {
    hero_title: "Our Story",
    story_p1: "Lake City Christian Church is a church plant in Middleburg Heights, Ohio. A lifetime Ohio native, Trevor Littleton and his wife Shanna felt the call to plant a church in northeastern Ohio. After nearly fifteen years of excuses, the Littletons began the church planting journey and moved their family of eleven to Strongsville in December 2023.",
    story_p2: "Looking for a place to hold Launch Team meetings, Lead Pastor Trevor Littleton and Discipleship Pastor Joe Hoagland met JD McIntosh and the members of the Southwest Christian Church. JD informed the two men that SWCC was in its twilight years and offered the new church plant its building and property. Moved by this gracious gesture, the Lake City launch team asked the members of SWCC to join the team, and the bold faith journey of Lake City Christian Church was underway.",
    story_p3: "LC3 began hosting launch team meetings in March 2024 with two \"pop up\" Sunday services on Palm Sunday and Easter. The months ahead bore witness to much growth for the Lake City Launch Team. Growing from eight people, to twelve, to fourteen, and to more than thirty; Lake City Christian Church was developing into the deep community of biblical disciples it aspired to become in the early days of 2023. However, the infant church experienced tragedy in May 2024 when Discipleship Pastor Joe Hoagland passed away suddenly in his sleep.",
    story_p4: "Broken hearted, the church continued. Joe was passionate about relational discipleship and the bold faith ministry of Lake City, a legacy to which he helped build. The Launch Team, a family of mature disciples rallied around one another and continued the ministry through the summer of 2024 hosting Launch Team gatherings, community events, and service projects in eager anticipation of the first Sunday service.",
    story_p5: "Lake City Christian Church officially launched on October 6, 2024. More than one hundred people meet every Sunday to worship and connect people to a life changing relationship with Jesus. In 2025, Lake City celebrated 32 baptisms, countless testimonies, and a thriving example of biblical discipleship in action. We are excited about what God is doing in this church and cannot wait to share our best years ahead with you!",
    kln_heading: "Kainos Leadership Network",
    kln_description: "KLN Exists to Plant and Equip Disciple Making Churches",
    memorial_heading: "In Memory of Executive Pastor Joe Hoagland",
    memorial_year: "2024",
    memorial_description: "Joe was passionate about seeing people's lives changed for Jesus. Joe had served as the Associate Pastor for several churches in Ohio and was currently the Director of Operations for Kainos Leadership Network. Joe was an integral part of the Lake City Launch Team and will be missed beyond measure.",
  });
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
        <FadeInSection className="max-w-3xl mx-auto">
          <p className="text-lg leading-relaxed text-foreground mb-8">
            {c.story_p1}
          </p>
          <p className="text-lg leading-relaxed text-foreground mb-8">
            {c.story_p2}
          </p>
          <p className="text-lg leading-relaxed text-foreground mb-8">
            {c.story_p3}
          </p>
          <p className="text-lg leading-relaxed text-foreground mb-8">
            {c.story_p4}
          </p>
          <p className="text-lg leading-relaxed text-foreground">
            {c.story_p5}
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
            {c.kln_heading}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            {c.kln_description}
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
            {c.memorial_heading}
          </h2>
          <p className="text-white/50 text-sm mb-8" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {c.memorial_year}
          </p>
          <p className="text-white/80 text-lg leading-relaxed">
            {c.memorial_description}
          </p>
        </FadeInSection>
      </section>

      <section className="bg-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/about">
            <Button variant="ghost" data-testid="link-back-to-about">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Who We Are
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
