import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Clock, Mail, Phone } from "lucide-react";
import { SiInstagram, SiFacebook, SiYoutube } from "react-icons/si";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePageContent } from "@/hooks/use-page-content";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  message: z.string().min(1, "Message is required"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

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

export default function Contact() {
  const [successMessage, setSuccessMessage] = useState(false);
  const c = usePageContent("contact", {
    hero_title: "Contact Us",
    address: "6717 Fry Road\nMiddleburg Heights, OH",
    service_time: "Sunday @ 10:00 AM",
    email: "info@lakecitycc.org",
    phone: "(216) 555-0123",
  });

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      setSuccessMessage(true);
      form.reset();
      toast({ title: "Message sent", description: "We'll get back to you soon." });
      setTimeout(() => setSuccessMessage(false), 5000);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    },
  });

  function onSubmit(values: ContactFormValues) {
    mutation.mutate(values);
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex items-center justify-center min-h-[60vh] bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
        <div className="relative z-10 text-center px-4 py-20">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            data-testid="text-contact-hero-title"
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

      {/* Contact Content Section */}
      <section className="bg-white py-20 md:py-24 px-4">
        <FadeInSection className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column: Church Info */}
            <div>
              {/* Church Name */}
              <FadeInSection delay={0.1}>
                <h2
                  className="text-2xl md:text-3xl font-bold text-foreground mb-8"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                  data-testid="text-church-name"
                >
                  Lake City Christian Church
                </h2>
              </FadeInSection>

              {/* Church Details Cards */}
              <div className="space-y-4">
                {/* Address Card */}
                <FadeInSection delay={0.2}>
                  <Card className="hover-elevate">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <MapPin className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1" data-testid="text-address-label">Address</h3>
                          <p className="text-muted-foreground" data-testid="text-address-value">
                            {c.address.split("\n").map((line, i) => (<span key={i}>{line}{i === 0 && <br />}</span>))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInSection>

                {/* Service Time Card */}
                <FadeInSection delay={0.3}>
                  <Card className="hover-elevate">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <Clock className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1" data-testid="text-service-time-label">Service Time</h3>
                          <p className="text-muted-foreground" data-testid="text-service-time-value">{c.service_time}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInSection>

                {/* Email Card */}
                <FadeInSection delay={0.4}>
                  <Card className="hover-elevate">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <Mail className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1" data-testid="text-email-label">Email</h3>
                          <p className="text-muted-foreground" data-testid="text-email-value">{c.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInSection>

                {/* Phone Card */}
                <FadeInSection delay={0.5}>
                  <Card className="hover-elevate">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <Phone className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1" data-testid="text-phone-label">Phone</h3>
                          <p className="text-muted-foreground" data-testid="text-phone-value">{c.phone}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInSection>
              </div>

              {/* Social Links */}
              <FadeInSection delay={0.6} className="mt-8">
                <h3
                  className="font-semibold text-foreground mb-4"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                  data-testid="text-follow-us-title"
                >
                  Follow Us
                </h3>
                <div className="flex gap-4">
                  <a
                    href="https://www.instagram.com/lakecitycc"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-instagram"
                    className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-gray-100 hover-elevate transition-colors hover:bg-gray-200"
                  >
                    <SiInstagram className="h-6 w-6 text-gray-800" />
                  </a>
                  <a
                    href="https://www.facebook.com/LakeCityCCOhio"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-facebook"
                    className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-gray-100 hover-elevate transition-colors hover:bg-gray-200"
                  >
                    <SiFacebook className="h-6 w-6 text-gray-800" />
                  </a>
                  <a
                    href="https://www.youtube.com/@LakeCityChristianChurch"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-youtube"
                    className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-gray-100 hover-elevate transition-colors hover:bg-gray-200"
                  >
                    <SiYoutube className="h-6 w-6 text-gray-800" />
                  </a>
                </div>
              </FadeInSection>

              {/* Map Placeholder */}
              <FadeInSection delay={0.7} className="mt-8">
                <Card className="overflow-hidden hover-elevate">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 h-64 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground font-medium">6717 Fry Road</p>
                        <p className="text-sm text-muted-foreground">Middleburg Heights, OH</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeInSection>
            </div>

            {/* Right Column: Contact Form */}
            <div>
              <FadeInSection delay={0.2}>
                <Card className="hover-elevate">
                  <CardContent className="pt-6">
                    <h3
                      className="text-xl md:text-2xl font-bold text-foreground mb-6"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      data-testid="text-send-message-title"
                    >
                      Send us a Message
                    </h3>

                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md"
                        data-testid="message-success"
                      >
                        <p className="text-green-800 font-medium">Thank you for your message! We will be in touch soon.</p>
                      </motion.div>
                    )}

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Name Field */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel data-testid="label-name">Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your name"
                                  {...field}
                                  data-testid="input-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Email Field */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel data-testid="label-email">Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your email"
                                  type="email"
                                  {...field}
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Message Field */}
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel data-testid="label-message">Message</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Your message"
                                  {...field}
                                  data-testid="input-message"
                                  className="resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          className="w-full text-white font-semibold"
                          style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                          disabled={form.formState.isSubmitting}
                          data-testid="button-submit-contact"
                        >
                          {form.formState.isSubmitting ? "Sending..." : "Send Message"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </FadeInSection>
            </div>
          </div>
        </FadeInSection>
      </section>
    </div>
  );
}
