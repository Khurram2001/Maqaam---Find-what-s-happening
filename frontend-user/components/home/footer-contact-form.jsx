"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MESSAGE_MAX_WORDS = 200;

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required (at least 2 characters)."),
  email: z.string().trim().min(1, "Email is required.").email("Please enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(10, "Message is required (at least 10 characters).")
    .refine((value) => countWords(value) <= MESSAGE_MAX_WORDS, {
      message: `Message must be at most ${MESSAGE_MAX_WORDS} words.`,
    }),
});

export function FooterContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const messageWords = countWords(message);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(id);
  }, [toast]);

  function showToast(variant, text) {
    setToast({ variant, text });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;

    const parsed = contactSchema.safeParse({ name, email, message });
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Please complete all required fields.";
      showToast("error", firstIssue);
      return;
    }

    setSending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setSending(false);

    setName("");
    setEmail("");
    setMessage("");
    showToast(
      "success",
      "Message sent successfully. Our team will review your note and respond within 24–48 hours."
    );
  }

  return (
      <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name *"
            required
            autoComplete="name"
            aria-label="Your name"
            className="h-9 border-white/15 bg-white/5 text-[#F4F6F6] placeholder:text-[#D4E6F1]/55"
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email *"
            required
            autoComplete="email"
            aria-label="Your email"
            className="h-9 border-white/15 bg-white/5 text-[#F4F6F6] placeholder:text-[#D4E6F1]/55"
          />
        </div>

        <div className="space-y-1.5">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message *"
            rows={4}
            required
            aria-label="Your message"
            className="min-h-[7.5rem] border-white/15 bg-white/5 text-[#F4F6F6] placeholder:text-[#D4E6F1]/55"
          />
          <p
            className={cn(
              "text-right text-[0.65rem] tabular-nums",
              messageWords > MESSAGE_MAX_WORDS ? "text-red-300" : "text-[#D4E6F1]/60"
            )}
          >
            {messageWords}/{MESSAGE_MAX_WORDS} words
          </p>
        </div>

        <Button
          type="submit"
          disabled={sending}
          className="h-10 w-full rounded-xl bg-[#FAF6F0] font-semibold text-[#0B4D53] transition-all duration-200 hover:scale-[1.01] hover:bg-[#FAF6F0]/90 disabled:opacity-70"
          variant="default"
        >
          {sending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            "Send"
          )}
        </Button>

        {toast ? (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "mx-auto mt-2 w-full rounded-xl px-4 py-3 text-center text-sm leading-relaxed shadow-md ring-1",
              toast.variant === "success"
                ? "bg-[#FAF6F0] text-[#0B4D53] ring-[#2DD4BF]/40"
                : "bg-[#3f1515] text-[#FEE2E2] ring-red-400/30"
            )}
          >
            {toast.text}
          </div>
        ) : null}
      </form>
  );
}
