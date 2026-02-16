import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { usePageContent } from "@/hooks/use-page-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, ArrowRight } from "lucide-react";
import coffeeImgPath from "@assets/LC_Coffe_Shop_1770933498062.png";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

const connectFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  interests: z.array(z.string()).optional(),
  prayerRequest: z.string().optional(),
});

type ConnectFormValues = z.infer<typeof connectFormSchema>;

export default function ConnectServe() {
  const c = usePageContent("connect-serve", {
    hero_title: "Connect & Serve",
    intro_heading: "We would like to get to know you better!",
    intro_description: "We are all a team and we lead together to create a warm and inviting atmosphere for people to encounter Jesus. Join us as we serve together, grow together, and experience the joy of making a lasting impact while connecting people to a life-changing relationship with Jesus.",
    volunteer_heading: "Ready to Serve?",
    volunteer_description: "There is a place for everyone to serve at Lake City. Whether you love greeting people, working with kids, or serving behind the scenes, we would love to have you on the team.",
  });
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ConnectFormValues>({
    resolver: zodResolver(connectFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      interests: [],
      prayerRequest: "",
    },
  });

  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async (data: ConnectFormValues) => {
      await apiRequest("POST", "/api/connect", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
      toast({ title: "Thank you!", description: "We received your connect card." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" });
    },
  });

  function onSubmit(data: ConnectFormValues) {
    mutation.mutate(data);
  }

  const interestOptions = [
    { id: "lake-city", label: "Lake City Christian Church" },
    { id: "next-steps", label: "Next Steps" },
    { id: "baptism", label: "Baptism" },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative flex items-center justify-center min-h-[60vh] bg-black overflow-hidden">
        <img
          src={coffeeImgPath}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
        <div className="relative z-10 text-center px-4 py-20">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-connect-serve-hero-title"
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
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground mb-6"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-connect-intro-heading"
          >
            {c.intro_heading}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {c.intro_description}
          </p>
        </FadeInSection>
      </section>

      <section className="bg-background py-20 md:py-24 px-4">
        <FadeInSection className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle
                className="text-2xl text-center"
                style={{ fontFamily: "Montserrat, sans-serif" }}
                data-testid="text-connect-card-title"
              >
                Connect Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-12" data-testid="text-connect-success">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3
                    className="text-xl font-bold text-foreground mb-2"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    Thank You!
                  </h3>
                  <p className="text-muted-foreground">
                    We received your information and will be in touch soon.
                  </p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="First name" {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Last name" {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(555) 555-5555" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Street address" {...field} data-testid="input-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="interests"
                      render={() => (
                        <FormItem>
                          <FormLabel>I'm interested in:</FormLabel>
                          <div className="space-y-3 mt-2">
                            {interestOptions.map((option) => (
                              <FormField
                                key={option.id}
                                control={form.control}
                                name="interests"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(option.id)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, option.id]);
                                          } else {
                                            field.onChange(current.filter((v) => v !== option.id));
                                          }
                                        }}
                                        data-testid={`checkbox-interest-${option.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {option.label}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prayerRequest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Struggling and need prayer? How can we pray for you?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Share your prayer request..."
                              className="resize-none"
                              rows={4}
                              {...field}
                              data-testid="textarea-prayer-request"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full text-white border-transparent"
                      style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                      data-testid="button-submit-connect"
                    >
                      {mutation.isPending ? "Submitting..." : "Submit"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </FadeInSection>
      </section>

      <section className="bg-black py-20 md:py-24 px-4">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            data-testid="text-volunteer-heading"
          >
            {c.volunteer_heading}
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            {c.volunteer_description}
          </p>
          <Link href="/contact">
            <Button
              className="text-white border-transparent"
              style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
              data-testid="link-volunteer-signup"
            >
              Volunteer Sign Up
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </FadeInSection>
      </section>
    </div>
  );
}
