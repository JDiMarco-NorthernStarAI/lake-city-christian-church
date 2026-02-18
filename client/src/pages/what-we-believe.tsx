import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { usePageContent } from "@/hooks/use-page-content";
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

export default function WhatWeBelieve() {
  const c = usePageContent("what-we-believe", {
    hero_title: "What We Believe",
    intro_text: "These are the core convictions that shape our faith and guide our community. We hold to the essentials of the Christian faith as revealed in Scripture.",
    belief_god: "We believe in one God \u2013 Father, Son and Holy Spirit.",
    belief_god_the_father: "We believe in God the Father Almighty, Creator of all things visible and invisible.",
    belief_jesus_christ: "We believe Jesus Christ is God's Son, born fully human and fully divine. He was crucified for the sins of the world, buried, and rose again on the third day. He ascended to heaven where He reigns as Lord. He will return to judge the living and the dead.",
    belief_holy_spirit: "We believe the Holy Spirit is personal and active, indwelling every Christian from the moment of salvation, empowering believers for service and growth.",
    belief_the_bible: "We believe the Bible is God's Holy Word, inspired by the Holy Spirit, and is the final authority for all matters of faith and practice.",
    belief_humanity_and_sin: "We believe people were created by God but have willfully sinned and are lost without Jesus Christ.",
    belief_salvation: "We believe forgiveness of sins comes through the blood of Jesus Christ and by God's grace \u2014 not by works or human effort.",
    belief_our_response: "We believe in admitting our sin, believing and confessing Jesus as Lord, repenting of sin, trusting fully in Jesus, and being baptized by immersion as an outward expression of an inward transformation.",
    belief_the_church: "We believe the Church consists of all Christians everywhere who have placed their faith in Jesus Christ.",
    belief_lords_supper: "We celebrate the Lord's Supper weekly as a proclamation of Christ's death, burial, and resurrection until He comes again.",
    belief_great_commission: "We are called to go and make disciples of all people groups, baptizing them and teaching them to obey everything Jesus commanded.",
  });

  const beliefKeys: { id: string; title: string; contentKey: string; references: string }[] = [
    { id: "god", title: "God", contentKey: "belief_god", references: "Matt 5:16, 45; 6:1, 4, 8, 9; James 1:17; John 1:1; 4:24; 14:9, 16-20; Gen 1:2; 2 Peter 1:21" },
    { id: "god-the-father", title: "God the Father", contentKey: "belief_god_the_father", references: "Gen 1:1; Acts 17:24-28; Heb 11:3" },
    { id: "jesus-christ", title: "Jesus Christ", contentKey: "belief_jesus_christ", references: "John 1:14; 1 John 4:9; John 3:16; 2 Peter 3:18; Matthew 21:11; John 1:14; 19:19; Romans 5:15-17; Colossians 2:9; 1 John 1:1; Matthew 1:18; Luke 1:26-38; Luke 23:44; 24:8; John 20:24-29; 1 Corinthians 15:3-8; Luke 22:69; Acts 1:1-9; Colossians 3:1; Matthew 24:36-42; John 14:1-3; Acts 1:10-11; 10:39-42; 1 Peter 4:5" },
    { id: "holy-spirit", title: "The Holy Spirit", contentKey: "belief_holy_spirit", references: "John 16:5-15; Acts 1:7-8; Romans 8:26-27; 1 Corinthians 3:16; 6:19; 2 Timothy 1:14" },
    { id: "the-bible", title: "The Bible", contentKey: "belief_the_bible", references: "Mark 12:36; John 14:26; 16:12-15; Acts 1:16; 1 Corinthians 2:12-13; 2 Timothy 3:14-16; 2 Peter 1:20-21; Isaiah 40:8; Matthew 5:18; 24:35; Romans 15:4; Hebrews 4:12" },
    { id: "humanity-and-sin", title: "Humanity & Sin", contentKey: "belief_humanity_and_sin", references: "Acts 4:12; Romans 3:23" },
    { id: "salvation", title: "Salvation", contentKey: "belief_salvation", references: "Matthew 26:28; Romans 5:1-11; 6:23; Ephesians 2:8-10; Hebrews 10:19-22; 1 Peter 1:18, 19; 1 John 1:7" },
    { id: "our-response", title: "Our Response", contentKey: "belief_our_response", references: "Romans 3:23; Titus 3:3-7; Matthew 10:32; Romans 10:9, 10; Luke 24:45-47; Acts 3:19; 17:30; Romans 10:11-13; Philippians 2:11; Acts 2:38; Romans 6:1-4" },
    { id: "the-church", title: "The Church", contentKey: "belief_the_church", references: "Matthew 16:13-18; Acts 2:14-47" },
    { id: "lords-supper", title: "The Lord's Supper", contentKey: "belief_lords_supper", references: "Acts 2:42; 20:7; 1 Corinthians 11:24-30" },
    { id: "great-commission", title: "The Great Commission", contentKey: "belief_great_commission", references: "Matthew 28:18-20" },
  ];
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
        <FadeInSection className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-lg text-muted-foreground leading-relaxed">
            {c.intro_text}
          </p>
        </FadeInSection>

        <FadeInSection className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {beliefKeys.map((belief) => (
              <AccordionItem key={belief.id} value={belief.id} data-testid={`accordion-${belief.id}`}>
                <AccordionTrigger
                  className="text-left text-base md:text-lg"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                  data-testid={`accordion-trigger-${belief.id}`}
                >
                  {belief.title}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                  <p>{c[belief.contentKey]}</p>
                  <p className="mt-3 text-sm italic text-muted-foreground/70" data-testid={`references-${belief.id}`}>
                    {belief.references}
                  </p>
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
