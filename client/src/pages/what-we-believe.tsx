import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

const beliefs = [
  {
    id: "god",
    title: "God",
    content: "We believe in one God \u2013 Father, Son and Holy Spirit.",
  },
  {
    id: "god-the-father",
    title: "God the Father",
    content: "We believe in God the Father Almighty, Creator of all things visible and invisible.",
  },
  {
    id: "jesus-christ",
    title: "Jesus Christ",
    content: "We believe Jesus Christ is God's Son, born fully human and fully divine. He was crucified for the sins of the world, buried, and rose again on the third day. He ascended to heaven where He reigns as Lord. He will return to judge the living and the dead.",
  },
  {
    id: "holy-spirit",
    title: "The Holy Spirit",
    content: "We believe the Holy Spirit is personal and active, indwelling every Christian from the moment of salvation, empowering believers for service and growth.",
  },
  {
    id: "the-bible",
    title: "The Bible",
    content: "We believe the Bible is God's Holy Word, inspired by the Holy Spirit, and is the final authority for all matters of faith and practice.",
  },
  {
    id: "humanity-and-sin",
    title: "Humanity & Sin",
    content: "We believe people were created by God but have willfully sinned and are lost without Jesus Christ.",
  },
  {
    id: "salvation",
    title: "Salvation",
    content: "We believe forgiveness of sins comes through the blood of Jesus Christ and by God's grace \u2014 not by works or human effort.",
  },
  {
    id: "our-response",
    title: "Our Response",
    content: "We believe in admitting our sin, believing and confessing Jesus as Lord, repenting of sin, trusting fully in Jesus, and being baptized by immersion as an outward expression of an inward transformation.",
  },
  {
    id: "the-church",
    title: "The Church",
    content: "We believe the Church consists of all Christians everywhere who have placed their faith in Jesus Christ.",
  },
  {
    id: "lords-supper",
    title: "The Lord's Supper",
    content: "We celebrate the Lord's Supper weekly as a proclamation of Christ's death, burial, and resurrection until He comes again.",
  },
  {
    id: "great-commission",
    title: "The Great Commission",
    content: "We are called to go and make disciples of all people groups, baptizing them and teaching them to obey everything Jesus commanded.",
  },
];

export default function WhatWeBelieve() {
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
            data-testid="text-believe-hero-title"
          >
            What We Believe
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
        <FadeInSection className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-lg text-muted-foreground leading-relaxed">
            These are the core convictions that shape our faith and guide our community. We hold to the essentials of the Christian faith as revealed in Scripture.
          </p>
        </FadeInSection>

        <FadeInSection className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {beliefs.map((belief) => (
              <AccordionItem key={belief.id} value={belief.id} data-testid={`accordion-${belief.id}`}>
                <AccordionTrigger
                  className="text-left text-base md:text-lg"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                  data-testid={`accordion-trigger-${belief.id}`}
                >
                  {belief.title}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                  {belief.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
