import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, DollarSign, Mail, Phone, CheckCircle, Clock, AlertCircle, Loader2, ClipboardList } from "lucide-react";
import type { SignupEvent, FormField } from "@shared/schema";
import { SIGNUP_CATEGORY_LABELS } from "@shared/schema";

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

interface SignupDetailData {
  event: SignupEvent;
  form: {
    id: number;
    title: string;
    description: string | null;
    slug: string;
    submitButtonText: string | null;
    successMessage: string | null;
  } | null;
  fields: FormField[];
}

interface SubmitResponse {
  submission: any;
  status: "confirmed" | "waitlisted";
  waitlistPosition: number | null;
  postSubmissionSettings: any;
}

function formatEventDate(dateStr: string | Date | null): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function formatEventTime(dateStr: string | Date | null): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return null;
  }
}

function getRegistrationState(event: SignupEvent): "open" | "not_started" | "closed" | "full" {
  const now = new Date();
  if (event.signupStartDate && now < new Date(event.signupStartDate)) {
    return "not_started";
  }
  if (event.signupEndDate && now > new Date(event.signupEndDate)) {
    return "closed";
  }
  if (event.maxSignups && event.currentSignupCount >= event.maxSignups && !event.waitlistEnabled) {
    return "full";
  }
  return "open";
}

export default function SignupDetail() {
  const [, params] = useRoute("/signups/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug || "";
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [guestCount, setGuestCount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoFilled, setAutoFilled] = useState(false);

  const { data, isLoading, error } = useQuery<SignupDetailData>({
    queryKey: ["/api/public/signups", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/signups/${slug}`);
      if (!res.ok) throw new Error("Event not found");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (!data?.fields || !user || autoFilled || !isAuthenticated) return;
    const prefilled: Record<string, any> = {};
    for (const field of data.fields) {
      const label = field.label.toLowerCase();
      const fType = field.fieldType;
      if (fType === "email" || label.includes("email")) {
        if (user.email) prefilled[field.id] = user.email;
      } else if (fType === "phone" || label.includes("phone")) {
        if (user.phone) prefilled[field.id] = user.phone;
      } else if (label.includes("name") && !label.includes("last") && !label.includes("first")) {
        if (user.name) prefilled[field.id] = user.name;
      } else if (label.includes("first name")) {
        if (user.name) prefilled[field.id] = user.name.split(" ")[0];
      } else if (label.includes("last name")) {
        if (user.name) {
          const parts = user.name.split(" ");
          if (parts.length > 1) prefilled[field.id] = parts.slice(1).join(" ");
        }
      } else if (label.includes("address") && !label.includes("city") && !label.includes("state") && !label.includes("zip")) {
        if (user.address) prefilled[field.id] = user.address;
      } else if (label.includes("city")) {
        if (user.city) prefilled[field.id] = user.city;
      } else if (label.includes("state")) {
        if (user.state) prefilled[field.id] = user.state;
      } else if (label.includes("zip")) {
        if (user.zip) prefilled[field.id] = user.zip;
      }
    }
    if (Object.keys(prefilled).length > 0) {
      setFormValues((prev) => ({ ...prefilled, ...prev }));
      setAutoFilled(true);
    }
  }, [data?.fields, user, isAuthenticated, autoFilled]);

  const submitMutation = useMutation({
    mutationFn: async (payload: { formData: Record<string, any>; guestCount: number }) => {
      const res = await apiRequest("POST", `/api/public/signups/${slug}/submit`, payload);
      return res.json();
    },
    onSuccess: (result: SubmitResponse) => {
      setSubmitted(true);
      setSubmitResult(result);
      setFormValues({});
      setErrors({});

      const postSettings = result.postSubmissionSettings as any;
      if (postSettings?.displayType === "redirect" && postSettings?.redirectUrl) {
        window.location.href = postSettings.redirectUrl;
      }
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to submit registration. Please try again.",
        variant: "destructive",
      });
    },
  });

  function handleFieldChange(fieldId: number, value: any) {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  function handleCheckboxGroupChange(fieldId: number, option: string, checked: boolean) {
    const current = (formValues[fieldId] as string[]) || [];
    const updated = checked ? [...current, option] : current.filter((v: string) => v !== option);
    handleFieldChange(fieldId, updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;

    const newErrors: Record<string, string> = {};
    for (const field of data.fields) {
      if (field.required) {
        const val = formValues[field.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
      if (field.fieldType === "email" && formValues[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formValues[field.id])) {
          newErrors[field.id] = "Please enter a valid email address";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    submitMutation.mutate({ formData: formValues, guestCount });
  }

  function renderField(field: FormField) {
    const options: string[] = Array.isArray(field.options) ? field.options : [];

    switch (field.fieldType) {
      case "text":
        return (
          <Input
            type="text"
            placeholder={field.placeholder || ""}
            value={formValues[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            data-testid={`input-field-${field.id}`}
          />
        );
      case "email":
        return (
          <Input
            type="email"
            placeholder={field.placeholder || ""}
            value={formValues[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            data-testid={`input-field-${field.id}`}
          />
        );
      case "phone":
        return (
          <Input
            type="tel"
            placeholder={field.placeholder || ""}
            value={formValues[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            data-testid={`input-field-${field.id}`}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder={field.placeholder || ""}
            value={formValues[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            data-testid={`input-field-${field.id}`}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            placeholder={field.placeholder || ""}
            value={formValues[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            data-testid={`input-field-${field.id}`}
          />
        );
      case "url":
        return (
          <Input
            type="url"
            placeholder={field.placeholder || ""}
            value={formValues[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            data-testid={`input-field-${field.id}`}
          />
        );
      case "hidden":
        return (
          <input
            type="hidden"
            value={formValues[field.id] || field.defaultValue || ""}
            data-testid={`input-field-${field.id}`}
          />
        );
      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder || ""}
            value={formValues[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={4}
            data-testid={`textarea-field-${field.id}`}
          />
        );
      case "select":
        return (
          <Select
            value={formValues[field.id] || ""}
            onValueChange={(val) => handleFieldChange(field.id, val)}
          >
            <SelectTrigger data-testid={`select-field-${field.id}`}>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <div className="space-y-2" data-testid={`radio-field-${field.id}`}>
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`field-${field.id}`}
                  value={opt}
                  checked={formValues[field.id] === opt}
                  onChange={() => handleFieldChange(field.id, opt)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-white/70">{opt}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="flex items-center gap-3" data-testid={`checkbox-field-${field.id}`}>
            <Checkbox
              checked={formValues[field.id] === true}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked === true)}
            />
            <span className="text-sm text-white/50">{field.placeholder || "Yes"}</span>
          </div>
        );
      case "checkbox_group":
        return (
          <div className="space-y-2" data-testid={`checkbox-group-field-${field.id}`}>
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={((formValues[field.id] as string[]) || []).includes(opt)}
                  onCheckedChange={(checked) => handleCheckboxGroupChange(field.id, opt, checked === true)}
                />
                <span className="text-sm text-white/70">{opt}</span>
              </label>
            ))}
          </div>
        );
      default:
        return (
          <Input
            placeholder={field.placeholder || ""}
            value={formValues[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            data-testid={`input-field-${field.id}`}
          />
        );
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pt-20">
        <section className="relative bg-black overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black to-neutral-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0033AA]/20 via-[#0088DD]/10 to-[#00D4FF]/20" />
          <div className="relative z-10 px-4 py-24 md:py-32 max-w-4xl mx-auto">
            <Skeleton className="h-8 w-24 bg-neutral-800 mb-4" data-testid="skeleton-badge" />
            <Skeleton className="h-10 w-3/4 bg-neutral-800 mb-4" data-testid="skeleton-title" />
            <Skeleton className="h-20 w-full bg-neutral-800 mb-6" data-testid="skeleton-description" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-48 bg-neutral-800" data-testid="skeleton-date" />
              <Skeleton className="h-5 w-40 bg-neutral-800" data-testid="skeleton-location" />
              <Skeleton className="h-5 w-32 bg-neutral-800" data-testid="skeleton-spots" />
            </div>
          </div>
        </section>
        <section className="bg-black py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-neutral-900 border-neutral-800 overflow-visible">
              <CardContent className="pt-6 space-y-6">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-neutral-800" />
                    <Skeleton className="h-9 w-full bg-neutral-800" />
                  </div>
                ))}
                <Skeleton className="h-9 w-full bg-neutral-800" />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black pt-20">
        <section className="relative flex items-center justify-center bg-black overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black to-neutral-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0033AA]/20 via-[#0088DD]/10 to-[#00D4FF]/20" />
          <div className="relative z-10 text-center px-4 py-24 md:py-32">
            <AlertCircle className="w-16 h-16 text-white/20 mx-auto mb-6" />
            <h1
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              data-testid="text-event-not-found"
            >
              Event Not Found
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              This signup event is not available or has been closed.
            </p>
            <Button
              variant="outline"
              className="border-neutral-700 text-neutral-300"
              onClick={() => navigate("/signups")}
              data-testid="button-back-to-signups"
            >
              Back to Sign Ups
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const { event, form, fields } = data;
  const categoryLabel = SIGNUP_CATEGORY_LABELS[event.category] || event.category;
  const formattedDate = formatEventDate(event.eventDate);
  const formattedTime = formatEventTime(event.eventDate);
  const formattedEndTime = event.eventEndDate ? formatEventTime(event.eventEndDate) : null;
  const registrationState = getRegistrationState(event);
  const spotsRemaining = event.maxSignups ? event.maxSignups - event.currentSignupCount : null;
  const eventSettings = (event.settings || {}) as any;
  const allowGuests = eventSettings.allowGuests === true;

  return (
    <div className="min-h-screen bg-black">
      <section className="relative bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-neutral-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0033AA]/20 via-[#0088DD]/10 to-[#00D4FF]/20" />

        {event.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover grayscale opacity-20"
              data-testid="img-event-hero"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
          </div>
        )}

        <div className="relative z-10 px-4 py-24 md:py-32 max-w-4xl mx-auto">
          <FadeInSection>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs" data-testid="badge-event-category">
                {categoryLabel}
              </Badge>
              {registrationState === "closed" && (
                <Badge variant="destructive" className="text-xs" data-testid="badge-registration-closed">
                  Registration Closed
                </Badge>
              )}
              {registrationState === "not_started" && (
                <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-300" data-testid="badge-registration-not-started">
                  Registration Not Open Yet
                </Badge>
              )}
              {registrationState === "full" && (
                <Badge variant="destructive" className="text-xs" data-testid="badge-event-full">
                  Full
                </Badge>
              )}
              {registrationState === "open" && spotsRemaining !== null && spotsRemaining > 0 && (
                <Badge variant="secondary" className="text-xs" data-testid="badge-spots-remaining">
                  {spotsRemaining} spots left
                </Badge>
              )}
              {registrationState === "open" && event.maxSignups && event.currentSignupCount >= event.maxSignups && event.waitlistEnabled && (
                <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-300" data-testid="badge-waitlist-available">
                  Waitlist Available
                </Badge>
              )}
            </div>

            <h1
              className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              data-testid="text-event-title"
            >
              {event.title}
            </h1>

            {event.description && (
              <p className="text-lg text-gray-300 max-w-3xl mb-8 leading-relaxed" data-testid="text-event-description">
                {event.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              {formattedDate && (
                <div className="flex items-center gap-3 text-white/60" data-testid="text-event-date">
                  <Calendar className="w-5 h-5 shrink-0 text-white/40" />
                  <div>
                    <p className="text-sm text-white/80">{formattedDate}</p>
                    {formattedTime && (
                      <p className="text-xs text-white/50">
                        {formattedTime}
                        {formattedEndTime && ` - ${formattedEndTime}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-3 text-white/60" data-testid="text-event-location">
                  <MapPin className="w-5 h-5 shrink-0 text-white/40" />
                  <span className="text-sm text-white/80">{event.location}</span>
                </div>
              )}

              {event.cost && (
                <div className="flex items-center gap-3 text-white/60" data-testid="text-event-cost">
                  <DollarSign className="w-5 h-5 shrink-0 text-white/40" />
                  <span className="text-sm text-white/80">{event.cost}</span>
                </div>
              )}

              {event.maxSignups && (
                <div className="flex items-center gap-3 text-white/60" data-testid="text-event-capacity">
                  <Users className="w-5 h-5 shrink-0 text-white/40" />
                  <span className="text-sm text-white/80">
                    {event.currentSignupCount} / {event.maxSignups} registered
                  </span>
                </div>
              )}

              {event.contactEmail && (
                <div className="flex items-center gap-3 text-white/60" data-testid="text-event-contact-email">
                  <Mail className="w-5 h-5 shrink-0 text-white/40" />
                  <a href={`mailto:${event.contactEmail}`} className="text-sm text-white/80 underline underline-offset-2">
                    {event.contactEmail}
                  </a>
                </div>
              )}

              {event.contactPhone && (
                <div className="flex items-center gap-3 text-white/60" data-testid="text-event-contact-phone">
                  <Phone className="w-5 h-5 shrink-0 text-white/40" />
                  <a href={`tel:${event.contactPhone}`} className="text-sm text-white/80 underline underline-offset-2">
                    {event.contactPhone}
                  </a>
                </div>
              )}

              {event.contactName && !event.contactEmail && !event.contactPhone && (
                <div className="flex items-center gap-3 text-white/60" data-testid="text-event-contact-name">
                  <Mail className="w-5 h-5 shrink-0 text-white/40" />
                  <span className="text-sm text-white/80">{event.contactName}</span>
                </div>
              )}
            </div>
          </FadeInSection>
        </div>
      </section>

      {event.externalUrl ? (
        <section className="bg-black py-12 md:py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <FadeInSection>
              <div className="w-full rounded-lg overflow-hidden">
                <iframe
                  src={event.externalUrl.replace("/viewform", "/viewform?embedded=true")}
                  width="100%"
                  height="1200"
                  frameBorder="0"
                  marginHeight={0}
                  marginWidth={0}
                  className="bg-white rounded-lg"
                >
                  Loading...
                </iframe>
              </div>
            </FadeInSection>
          </div>
        </section>
      ) : (
      <section className="bg-black py-12 md:py-20 px-4">
        <div className="max-w-2xl mx-auto">
          {submitted && submitResult ? (
            <FadeInSection>
              <Card className="bg-neutral-900 border-neutral-800 overflow-visible" data-testid="card-submission-result">
                <CardContent className="py-12 text-center">
                  {submitResult.status === "confirmed" ? (
                    <>
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h2
                        className="text-2xl font-bold text-white mb-2"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                        data-testid="text-confirmed-title"
                      >
                        You're registered!
                      </h2>
                      <p className="text-white/50 mb-6" data-testid="text-confirmed-message">
                        {(submitResult.postSubmissionSettings as any)?.successMessage ||
                          "Your registration has been confirmed. We look forward to seeing you!"}
                      </p>
                    </>
                  ) : (
                    <>
                      <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                      <h2
                        className="text-2xl font-bold text-white mb-2"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                        data-testid="text-waitlisted-title"
                      >
                        You're on the waitlist
                      </h2>
                      <p className="text-amber-300/80 mb-2" data-testid="text-waitlist-position">
                        Waitlist position: #{submitResult.waitlistPosition}
                      </p>
                      <p className="text-white/50 mb-6" data-testid="text-waitlisted-message">
                        {(submitResult.postSubmissionSettings as any)?.successMessage ||
                          "We'll notify you if a spot opens up."}
                      </p>
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="border-neutral-700 text-neutral-300"
                    onClick={() => navigate("/signups")}
                    data-testid="button-back-to-signups"
                  >
                    Browse More Sign Ups
                  </Button>
                </CardContent>
              </Card>
            </FadeInSection>
          ) : registrationState === "closed" ? (
            <FadeInSection>
              <Card className="bg-neutral-900 border-neutral-800 overflow-visible" data-testid="card-registration-closed">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h2
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                    data-testid="text-closed-title"
                  >
                    Registration Closed
                  </h2>
                  <p className="text-white/50" data-testid="text-closed-message">
                    The registration period for this event has ended.
                  </p>
                </CardContent>
              </Card>
            </FadeInSection>
          ) : registrationState === "not_started" ? (
            <FadeInSection>
              <Card className="bg-neutral-900 border-neutral-800 overflow-visible" data-testid="card-registration-not-started">
                <CardContent className="py-12 text-center">
                  <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h2
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                    data-testid="text-not-started-title"
                  >
                    Registration Not Open Yet
                  </h2>
                  <p className="text-white/50" data-testid="text-not-started-message">
                    Registration for this event has not started yet. Please check back later.
                  </p>
                </CardContent>
              </Card>
            </FadeInSection>
          ) : registrationState === "full" ? (
            <FadeInSection>
              <Card className="bg-neutral-900 border-neutral-800 overflow-visible" data-testid="card-event-full">
                <CardContent className="py-12 text-center">
                  <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h2
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                    data-testid="text-full-title"
                  >
                    This Event is Full
                  </h2>
                  <p className="text-white/50" data-testid="text-full-message">
                    All spots have been filled. Please check back for future events.
                  </p>
                </CardContent>
              </Card>
            </FadeInSection>
          ) : form && fields.length > 0 ? (
            <FadeInSection>
              <Card className="bg-neutral-900 border-neutral-800 overflow-visible" data-testid="card-signup-form">
                <CardContent className="pt-6">
                  <h2
                    className="text-xl font-bold text-white mb-6"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                    data-testid="text-form-heading"
                  >
                    Register
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-signup">
                    {fields.map((field) => (
                      field.fieldType === "hidden" ? (
                        <div key={field.id}>{renderField(field)}</div>
                      ) : (
                        <div key={field.id} className="space-y-2" data-testid={`form-field-${field.id}`}>
                          <Label className="text-sm font-medium text-white/90">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {field.helpText && (
                            <p className="text-xs text-white/40">{field.helpText}</p>
                          )}
                          {renderField(field)}
                          {errors[field.id] && (
                            <p className="text-sm text-red-500" data-testid={`error-field-${field.id}`}>
                              {errors[field.id]}
                            </p>
                          )}
                        </div>
                      )
                    ))}

                    {allowGuests && (
                      <div className="space-y-2" data-testid="form-field-guest-count">
                        <Label className="text-sm font-medium text-white/90">
                          Number of Additional Guests
                        </Label>
                        <p className="text-xs text-white/40">
                          How many additional guests will you be bringing?
                        </p>
                        <Input
                          type="number"
                          min={0}
                          value={guestCount}
                          onChange={(e) => setGuestCount(Math.max(0, parseInt(e.target.value) || 0))}
                          data-testid="input-guest-count"
                        />
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#0033AA] to-[#0088DD] border-[#0055CC]"
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-signup"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Sign Up"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </FadeInSection>
          ) : (
            <FadeInSection>
              <Card className="bg-neutral-900 border-neutral-800 overflow-visible" data-testid="card-no-form">
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h2
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                    data-testid="text-no-form-title"
                  >
                    Registration
                  </h2>
                  <p className="text-white/50" data-testid="text-no-form-message">
                    No registration form is available for this event at this time.
                  </p>
                </CardContent>
              </Card>
            </FadeInSection>
          )}
        </div>
      </section>
      )}
    </div>
  );
}
