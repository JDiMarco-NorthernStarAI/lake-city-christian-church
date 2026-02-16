import { useState, useEffect } from "react";
import { useRoute } from "wouter";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Loader2 } from "lucide-react";
import type { FormField } from "@shared/schema";

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

interface OptionUsageInfo {
  capacity?: number;
  used: number;
  remaining?: number;
}

interface PublicFormField extends FormField {
  optionUsage?: Record<string, OptionUsageInfo>;
}

interface PublicFormData {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  submitButtonText: string | null;
  successMessage: string | null;
  requireAuth: boolean;
  allowMultiple: boolean;
  fields: PublicFormField[];
}

function getAutoFillValue(field: PublicFormField, user: any): string | undefined {
  const label = field.label.toLowerCase().trim();
  const type = field.fieldType;

  if (type !== "text" && type !== "email" && type !== "phone") return undefined;

  if (type === "email" || label.includes("email")) {
    return user.email || undefined;
  }
  if (type === "phone" || label.includes("phone number") || label === "phone" || label.includes("cell phone")) {
    return user.phone || undefined;
  }
  if (label.includes("first and last name") || label.includes("first & last name") || label === "full name" || label === "name" || label === "your name") {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
    return user.name || undefined;
  }
  if (label.includes("first name") && !label.includes("last")) {
    return user.firstName || undefined;
  }
  if (label.includes("last name") && !label.includes("first")) {
    return user.lastName || undefined;
  }
  if (label.includes("address") && !label.includes("email")) {
    return user.address || undefined;
  }

  return undefined;
}

export default function PublicForm() {
  const [, params] = useRoute("/forms/:slug");
  const slug = params?.slug || "";
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoFilled, setAutoFilled] = useState(false);

  const { data: formData, isLoading, error } = useQuery<PublicFormData>({
    queryKey: ["/api/public/forms", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/forms/${slug}`);
      if (!res.ok) throw new Error("Form not found");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (authUser && formData && !autoFilled && !submitted) {
      const prefilled: Record<string, any> = {};
      for (const field of formData.fields) {
        const val = getAutoFillValue(field, authUser);
        if (val) {
          prefilled[field.id] = val;
        }
      }
      if (Object.keys(prefilled).length > 0) {
        setFormValues((prev) => {
          const merged = { ...prefilled };
          for (const [k, v] of Object.entries(prev)) {
            if (v !== undefined && v !== null && v !== "") {
              merged[k] = v;
            }
          }
          return merged;
        });
      }
      setAutoFilled(true);
    }
  }, [authUser, formData, autoFilled, submitted]);

  const submitMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest("POST", `/api/public/forms/${slug}/submit`, data);
      return res.json();
    },
    onSuccess: (result) => {
      setSubmitted(true);
      setFormValues({});
      setErrors({});
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to submit form. Please try again.",
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
    if (!formData) return;

    const newErrors: Record<string, string> = {};
    for (const field of formData.fields) {
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

    submitMutation.mutate(formValues);
  }

  function getOptionLabels(field: PublicFormField): string[] {
    if (!Array.isArray(field.options)) return [];
    return (field.options as any[]).map((o: any) => {
      if (typeof o === "string") return o;
      if (o && typeof o === "object" && o.label) return o.label;
      return String(o);
    });
  }

  function isOptionFull(field: PublicFormField, optLabel: string): boolean {
    if (!field.optionUsage) return false;
    const info = field.optionUsage[optLabel];
    return !!(info && info.capacity && info.remaining !== undefined && info.remaining <= 0);
  }

  function getOptionSuffix(field: PublicFormField, optLabel: string): string {
    if (!field.optionUsage) return "";
    const info = field.optionUsage[optLabel];
    if (!info || !info.capacity) return "";
    if (info.remaining !== undefined && info.remaining <= 0) return " (Full)";
    return ` (${info.remaining} spot${info.remaining === 1 ? "" : "s"} left)`;
  }

  function renderField(field: PublicFormField) {
    const fieldError = errors[field.id];
    const options: string[] = getOptionLabels(field);

    switch (field.fieldType) {
      case "text":
      case "email":
      case "phone":
      case "number":
      case "date":
        return (
          <Input
            type={field.fieldType === "phone" ? "tel" : field.fieldType}
            placeholder={field.placeholder || ""}
            value={formValues[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
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
              {options.map((opt) => {
                const full = isOptionFull(field, opt);
                const suffix = getOptionSuffix(field, opt);
                return (
                  <SelectItem key={opt} value={opt} disabled={full} data-testid={`select-option-${field.id}-${opt.replace(/\s+/g, "-")}`}>
                    {opt}{suffix}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <div className="space-y-2" data-testid={`radio-field-${field.id}`}>
            {options.map((opt) => {
              const full = isOptionFull(field, opt);
              const suffix = getOptionSuffix(field, opt);
              return (
                <label key={opt} className={`flex items-center gap-3 ${full ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    type="radio"
                    name={`field-${field.id}`}
                    value={opt}
                    checked={formValues[field.id] === opt}
                    onChange={() => handleFieldChange(field.id, opt)}
                    className="w-4 h-4"
                    disabled={full}
                  />
                  <span className="text-sm">
                    {opt}
                    {suffix && <span className={`ml-1 text-xs ${full ? "text-muted-foreground" : "text-blue-400"}`}>{suffix}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        );
      case "checkbox":
        return (
          <div className="flex items-center gap-3" data-testid={`checkbox-field-${field.id}`}>
            <Checkbox
              checked={formValues[field.id] === true}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked === true)}
            />
            <span className="text-sm text-muted-foreground">{field.placeholder || "Yes"}</span>
          </div>
        );
      case "checkbox_group":
        return (
          <div className="space-y-2" data-testid={`checkbox-group-field-${field.id}`}>
            {options.map((opt) => {
              const full = isOptionFull(field, opt);
              const suffix = getOptionSuffix(field, opt);
              const isChecked = ((formValues[field.id] as string[]) || []).includes(opt);
              return (
                <label key={opt} className={`flex items-center gap-3 ${full && !isChecked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => handleCheckboxGroupChange(field.id, opt, checked === true)}
                    disabled={full && !isChecked}
                  />
                  <span className="text-sm">
                    {opt}
                    {suffix && <span className={`ml-1 text-xs ${full ? "text-muted-foreground" : "text-blue-400"}`}>{suffix}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        );
      default:
        return (
          <Input
            placeholder={field.placeholder || ""}
            value={formValues[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen pt-20">
        <section className="relative py-24 bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0033AA]/20 via-[#0088DD]/10 to-[#00D4FF]/20" />
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Form Not Found</h1>
            <p className="text-lg text-gray-300">This form is not available or has been closed.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <section className="relative py-24 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0033AA]/20 via-[#0088DD]/10 to-[#00D4FF]/20" />
        <div className="relative container mx-auto px-4 text-center">
          <FadeInSection>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-form-title">
              {formData.title}
            </h1>
            {formData.description && (
              <p className="text-lg text-gray-300 max-w-2xl mx-auto" data-testid="text-form-description">
                {formData.description}
              </p>
            )}
          </FadeInSection>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-2xl">
          {submitted ? (
            <FadeInSection>
              <Card data-testid="card-form-success">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Submitted Successfully</h2>
                  <p className="text-muted-foreground mb-6" data-testid="text-success-message">
                    {formData.successMessage || "Thank you for your submission!"}
                  </p>
                  {formData.allowMultiple && (
                    <Button
                      onClick={() => setSubmitted(false)}
                      variant="outline"
                      data-testid="button-submit-another"
                    >
                      Submit Another Response
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FadeInSection>
          ) : (
            <FadeInSection>
              <Card data-testid="card-form">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-public">
                    {formData.fields.map((field) => (
                      <div key={field.id} className="space-y-2" data-testid={`form-field-${field.id}`}>
                        <Label className="text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {field.helpText && (
                          <p className="text-xs text-muted-foreground">{field.helpText}</p>
                        )}
                        {renderField(field)}
                        {errors[field.id] && (
                          <p className="text-sm text-red-500" data-testid={`error-field-${field.id}`}>
                            {errors[field.id]}
                          </p>
                        )}
                      </div>
                    ))}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#0033AA] to-[#0088DD] border-[#0055CC]"
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-form"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        formData.submitButtonText || "Submit"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </FadeInSection>
          )}
        </div>
      </section>
    </div>
  );
}
