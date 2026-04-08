"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z
    .string()
    .min(5, { message: "Subject must be at least 5 characters." })
    .max(200),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters." })
    .max(2000),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { maintenanceMode, user } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const disabled = maintenanceMode && !isAdmin;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    if (disabled) {
      toast({
        title: "Maintenance in Progress",
        description: "Submissions are temporarily disabled.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        reset();
        toast({
          title: "Message Sent Successfully",
          description:
            "Thank you for contacting us. We will get back to you soon.",
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: "Failed to send",
          description: errorData?.detail || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Failed to send",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-4"
      aria-label="Contact form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-2">
        <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>
          Full Name
        </Label>
        <Input
          id="name"
          placeholder="Your name"
          {...register("name")}
          className={
            errors.name
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.name && (
          <p className="text-xs font-medium text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label
          htmlFor="email"
          className={errors.email ? "text-destructive" : ""}
        >
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          className={
            errors.email
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.email && (
          <p className="text-xs font-medium text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label
          htmlFor="subject"
          className={errors.subject ? "text-destructive" : ""}
        >
          Subject
        </Label>
        <Input
          id="subject"
          placeholder="Subject"
          {...register("subject")}
          className={
            errors.subject
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.subject && (
          <p className="text-xs font-medium text-destructive">
            {errors.subject.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label
          htmlFor="message"
          className={errors.message ? "text-destructive" : ""}
        >
          Message
        </Label>
        <Textarea
          id="message"
          placeholder="How can we help?"
          rows={5}
          {...register("message")}
          className={
            errors.message
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.message && (
          <p className="text-xs font-medium text-destructive">
            {errors.message.message}
          </p>
        )}
      </div>

      {disabled && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-800">
          <AlertTitle>Maintenance in Progress</AlertTitle>
          <AlertDescription>
            Submissions are temporarily disabled.
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || disabled}
      >
        {isSubmitting ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
