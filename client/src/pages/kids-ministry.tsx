import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, ArrowRight, Calendar, Users, Heart } from "lucide-react";

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

const ageGroups = [
  {
    title: "Nursery",
    ages: "0-2 years",
    description: "Infants and toddlers will have an opportunity for their own style of worship and biblical story in video format along with ample time to play and make new friends.",
  },
  {
    title: "Pre-K",
    ages: "2\u00BD - 5 years",
    description: "We hope to encourage creativity and exploration through Biblical songs, games, play, crafts and storytelling. Our serve team desires to help build confidence and community as we learn to share and forge new friendships, loving others as God loves us!",
  },
  {
    title: "Kids",
    ages: "K - 5th",
    description: "Lake City Kids is where we learn to live out being Big-Small-Bold in a way they can understand. Kids will start BIG with worship, designed to be high energy and fun! Then kids move onto SMALL groups, where they can learn at their own level. By the end of the service, they will learn what it means to be BOLD sharing with others how much God loves us all!",
  },
];

const infoItems = [
  {
    title: "Family Sunday",
    icon: Calendar,
    description: "The First Sunday of Every Month is Family Sunday! This gives families and kids the opportunity to worship together! The Nursery space will remain open.",
  },
  {
    title: "Serve Team",
    icon: Users,
    description: "Volunteers are trained to ensure your child is safe and well cared for during service.",
  },
  {
    title: "Special Care",
    icon: Heart,
    description: "If you have a child with special needs or a disability, we want to encourage you to connect with us and let us know you are coming.",
  },
];

export default function KidsMinistry() {
  return (
    <div className="min-h-screen">
      <section className="relative flex items-center justify-center min-h-[60vh] bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
        <div className="relative z-10 text-center px-4 py-20">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-kids-hero-title"
          >
            Lake City Kids
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

      <section className="py-20 md:py-24 px-4">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <Baby className="w-10 h-10 text-blue-500 mx-auto mb-6" />
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground mb-6"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-kids-welcome"
          >
            Welcome to Lake City Kids
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A place where your child will feel comfortable, cared for and loved! We look forward to building relationships with you as we share life together!
          </p>
        </FadeInSection>
      </section>

      <section className="py-20 md:py-24 px-4 bg-background">
        <FadeInSection className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-kids-age-groups"
          >
            Age Groups
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ageGroups.map((group, index) => (
              <FadeInSection key={group.title} delay={index * 0.1}>
                <Card className="h-full" data-testid={`card-age-group-${group.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  <CardHeader>
                    <CardTitle className="text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {group.title}
                    </CardTitle>
                    <p className="text-sm text-blue-500 font-medium">{group.ages}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">{group.description}</p>
                  </CardContent>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </FadeInSection>
      </section>

      <section className="py-20 md:py-24 px-4">
        <FadeInSection className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-kids-info"
          >
            Good to Know
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {infoItems.map((item, index) => (
              <FadeInSection key={item.title} delay={index * 0.1}>
                <Card className="h-full bg-muted border-transparent" data-testid={`card-info-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  <CardHeader>
                    <item.icon className="w-6 h-6 text-blue-500 mb-2" />
                    <CardTitle className="text-base" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </FadeInSection>
      </section>

      <section className="py-20 md:py-24 px-4">
        <FadeInSection className="max-w-xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground mb-6"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-kids-cta"
          >
            Have Questions?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            We would love to hear from you and help your family get connected.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="text-white border-transparent"
              style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
              data-testid="button-kids-contact"
            >
              Get In Touch
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </FadeInSection>
      </section>
    </div>
  );
}