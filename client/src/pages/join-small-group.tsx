import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface CityGroup {
  id: number;
  name: string;
  description: string | null;
  meetingDay: string | null;
  meetingTime: string | null;
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

export default function JoinSmallGroup() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  const { data: groups = [], isLoading } = useQuery<CityGroup[]>({
    queryKey: ["/api/city-groups/active"],
    queryFn: async () => {
      const res = await fetch("/api/city-groups/active");
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
  });

  function toggleGroup(id: number) {
    setSelectedGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || selectedGroups.length === 0) {
      toast({ title: "Please fill in your name, email, and select at least one group", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/city-groups/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, groupIds: selectedGroups }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit");
      }
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
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
            >
              Join a City Group
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
          <FadeInSection className="max-w-xl mx-auto text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Thank You!
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Your request has been submitted. A group leader will be in touch with you soon!
            </p>
            <Link href="/small-groups">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Small Groups
              </Button>
            </Link>
          </FadeInSection>
        </section>
      </div>
    );
  }

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
          >
            Join a City Group
          </motion.h1>
          <motion.p
            className="text-white/70 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Select the group(s) you're interested in and we'll connect you with a leader.
          </motion.p>
          <motion.div
            className="w-16 h-1 mx-auto rounded-full mt-4"
            style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </div>
      </section>

      <section className="bg-white py-20 md:py-24 px-4">
        <FadeInSection className="max-w-2xl mx-auto">
          <Card className="hover-elevate">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-base font-semibold">Name (First, Last)</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-base font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-base font-semibold">Phone # <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Select Your Group(s)</Label>
                  <p className="text-sm text-muted-foreground">Check the groups you're interested in joining. A group leader will contact you.</p>

                  {isLoading ? (
                    <p className="text-muted-foreground text-sm">Loading groups...</p>
                  ) : groups.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No groups are currently available.</p>
                  ) : (
                    <div className="space-y-3">
                      {groups.map(group => (
                        <div
                          key={group.id}
                          role="button"
                          tabIndex={0}
                          className={`flex items-start gap-3 p-4 rounded-md border cursor-pointer transition-colors ${
                            selectedGroups.includes(group.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => toggleGroup(group.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleGroup(group.id); } }}
                        >
                          <div className={`mt-1 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center ${
                            selectedGroups.includes(group.id) ? "bg-blue-500 border-blue-500" : "border-gray-400"
                          }`}>
                            {selectedGroups.includes(group.id) && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{group.name}</p>
                            {(group.meetingDay || group.meetingTime) && (
                              <p className="text-sm text-muted-foreground">
                                {[group.meetingDay, group.meetingTime].filter(Boolean).join(" @ ")}
                              </p>
                            )}
                            {group.description && (
                              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full text-white font-semibold"
                  style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                  disabled={submitting || selectedGroups.length === 0}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </FadeInSection>
      </section>

      <section className="bg-white pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/small-groups">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Small Groups
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
