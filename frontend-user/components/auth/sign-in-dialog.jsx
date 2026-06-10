"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiJson } from "@/lib/api-client";
import {
  maxLocalPhoneDigits,
  minLocalPhoneDigits,
  sanitizeCountryCode,
  sanitizePhoneLocal,
} from "@/lib/phone-countries";
import { validateRegisterForm } from "@/lib/register-validation";
import { cn } from "@/lib/utils";

const authInputClass =
  "h-10 rounded-xl border-[#0B4D53]/20 bg-white text-[#0B4D53] placeholder:text-[#0B4D53]/40 focus-visible:border-[#0B4D53] focus-visible:ring-[#0B4D53]/20";

const authLabelClass = "text-xs text-[#0B4D53]/80";

const authToastClass = {
  success: "bg-[#FAF6F0] text-[#0B4D53] ring-[#2DD4BF]/40",
  error: "bg-[#3f1515] text-[#FEE2E2] ring-red-400/30",
};

const primaryAuthButtonClass =
  "mt-1 inline-flex h-11 w-full gap-2 rounded-xl bg-[#0B4D53] text-[#F4F6F6] hover:bg-[#0a444a]";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const forgotSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

function mapZodFieldErrors(flat) {
  const out = {};
  const fe = flat.fieldErrors;
  if (!fe) return out;
  for (const [k, v] of Object.entries(fe)) {
    if (v?.[0]) out[k] = v[0];
  }
  return out;
}

/**
 * @param {{
 *   onSuccess: () => void | Promise<void>;
 *   triggerLabel?: string;
 *   triggerIcon?: React.ReactNode;
 *   triggerClassName?: string;
 *   triggerVariant?: "default" | "outline" | "secondary" | "ghost";
 *   triggerSize?: "sm" | "default" | "lg" | "icon";
 *   defaultTab?: "login" | "register";
 *   open?: boolean;
 *   onOpenChange?: (next: boolean) => void;
 *   hideTrigger?: boolean;
 * }} props
 */
export function SignInDialog({
  onSuccess,
  triggerLabel = "Login",
  triggerIcon,
  triggerClassName,
  triggerVariant = "default",
  triggerSize = "sm",
  defaultTab = "login",
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [tab, setTab] = useState("login");
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState({});
  const [loginBanner, setLoginBanner] = useState(null);
  const [loginPending, setLoginPending] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [verifySending, setVerifySending] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotErrors, setForgotErrors] = useState({});
  const [forgotBanner, setForgotBanner] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotPending, setForgotPending] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCountryCode, setRegCountryCode] = useState("");
  const [regPhoneLocal, setRegPhoneLocal] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regErrors, setRegErrors] = useState({});
  const [regBanner, setRegBanner] = useState(null);
  const [regToast, setRegToast] = useState(null);
  const [regPending, setRegPending] = useState(false);
  const [regDone, setRegDone] = useState(false);

  const normalizedCountryCode = sanitizeCountryCode(regCountryCode);
  const phoneMinDigits = normalizedCountryCode
    ? minLocalPhoneDigits(normalizedCountryCode)
    : 1;
  const phoneMaxDigits = normalizedCountryCode
    ? maxLocalPhoneDigits(normalizedCountryCode)
    : 15;

  useEffect(() => {
    if (!regToast) return undefined;
    const id = window.setTimeout(() => setRegToast(null), 4500);
    return () => window.clearTimeout(id);
  }, [regToast]);

  const authHeader =
    tab === "login"
      ? {
          title: "Welcome Back",
          description:
            "Sign in to your account to post, pin, and manage your community gatherings.",
        }
      : {
          title: "Join Maqaam",
          description:
            "Create an organizer profile to start pinning verified Islamic events for your local community.",
        };

  function resetLoginForm() {
    setLoginErrors({});
    setLoginBanner(null);
    setNeedsVerify(false);
    setShowForgot(false);
    setForgotErrors({});
    setForgotBanner(null);
    setForgotSuccess(false);
  }

  function resetRegisterForm() {
    setRegErrors({});
    setRegBanner(null);
    setRegToast(null);
    setRegDone(false);
    setRegCountryCode("");
    setRegPhoneLocal("");
    setRegConfirmPassword("");
  }

  function showRegToast(variant, text) {
    setRegToast({ variant, text });
  }

  function handleOpenChange(next) {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
    if (next) {
      resetLoginForm();
      resetRegisterForm();
      setTab(defaultTab);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginBanner(null);
    setNeedsVerify(false);
    setLoginErrors({});

    const parsed = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!parsed.success) {
      setLoginErrors(mapZodFieldErrors(parsed.error.flatten()));
      return;
    }

    setLoginPending(true);
    const { ok, status, json } = await apiJson("/auth/login", {
      method: "POST",
      body: {
        email: parsed.data.email.toLowerCase(),
        password: parsed.data.password,
      },
    });
    setLoginPending(false);

    if (ok && json.success) {
      handleOpenChange(false);
      await onSuccess?.();
      return;
    }

    const msg = json?.error?.message || "Could not sign in";
    setLoginBanner(msg);

    if (status === 403 && json?.error?.code === "FORBIDDEN") {
      setNeedsVerify(true);
    }
  }

  async function handleResendVerification() {
    const email = loginEmail.trim().toLowerCase();
    if (!email) {
      setLoginBanner("Enter your email above, then tap send again.");
      return;
    }
    setVerifySending(true);
    setLoginBanner(null);
    const { ok, json } = await apiJson("/auth/verify-email/request", {
      method: "POST",
      body: { email },
    });
    setVerifySending(false);
    if (ok && json.success) {
      setLoginBanner(
        json.data?.message ||
          "If your account exists, a verification email has been sent. Check your inbox and spam folder."
      );
      setNeedsVerify(true);
    } else {
      setLoginBanner(json?.error?.message || "Could not send verification email.");
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setForgotErrors({});
    setForgotBanner(null);
    setForgotSuccess(false);

    const parsed = forgotSchema.safeParse({ email: forgotEmail });
    if (!parsed.success) {
      setForgotErrors(mapZodFieldErrors(parsed.error.flatten()));
      return;
    }

    setForgotPending(true);
    const { ok, json } = await apiJson("/auth/forgot-password", {
      method: "POST",
      body: { email: parsed.data.email.toLowerCase() },
    });
    setForgotPending(false);

    if (ok && json.success) {
      setForgotSuccess(true);
      setForgotBanner(
        json.data?.message ||
          "If an account exists for that email, we sent a reset link. Check your inbox and spam folder."
      );
    } else {
      setForgotBanner(json?.error?.message || "Something went wrong.");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegErrors({});
    setRegBanner(null);
    setRegToast(null);
    setRegDone(false);

    const validation = validateRegisterForm({
      name: regName,
      email: regEmail,
      countryCode: regCountryCode,
      phoneLocal: regPhoneLocal,
      password: regPassword,
      confirmPassword: regConfirmPassword,
    });

    if (!validation.success) {
      setRegErrors(validation.errors);
      showRegToast("error", validation.firstError);
      return;
    }

    setRegPending(true);
    const { ok, json } = await apiJson("/auth/register", {
      method: "POST",
      body: {
        name: validation.data.name,
        email: validation.data.email,
        phoneNumber: validation.data.phoneNumber,
        password: validation.data.password,
      },
    });
    setRegPending(false);

    if (ok && json.success) {
      setRegDone(true);
      setLoginEmail(validation.data.email);
      return;
    }

    const details = json?.error?.details;
    if (details?.fieldErrors && typeof details.fieldErrors === "object") {
      const mapped = {};
      for (const [k, v] of Object.entries(details.fieldErrors)) {
        if (Array.isArray(v) && v[0]) mapped[k] = v[0];
      }
      if (Object.keys(mapped).length) {
        setRegErrors(mapped);
        showRegToast("error", Object.values(mapped)[0]);
      }
    }
    const apiMessage = json?.error?.message || "Could not create account.";
    setRegBanner(apiMessage);
    if (!details?.fieldErrors) showRegToast("error", apiMessage);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger ? (
        <DialogTrigger
          className={cn(buttonVariants({ variant: triggerVariant, size: triggerSize }), triggerClassName)}
          title={triggerLabel}
        >
          {triggerIcon ? (
            <span className="inline-flex items-center gap-1.5">
              {triggerIcon}
              {triggerLabel ? <span>{triggerLabel}</span> : null}
            </span>
          ) : (
            triggerLabel
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent
        className="flex w-[calc(100%-1rem)] max-h-[min(92vh,680px)] flex-col gap-0 overflow-hidden rounded-2xl border border-[#0B4D53]/10 bg-[#FAF6F0] p-0 sm:max-w-md sm:w-full"
        showCloseButton
      >
        <div className="shrink-0 border-b border-[#0B4D53]/10 px-4 py-4 sm:px-5 sm:py-5">
          <DialogHeader className="gap-2 text-left pr-8">
            <DialogTitle className="font-heading text-xl font-semibold tracking-tight text-[#0B4D53] sm:text-2xl">
              {authHeader.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-[#0B4D53]/70">
              {authHeader.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-5 sm:py-5">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-4">
            <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl bg-[#F4F6F6] p-1 ring-1 ring-[#0B4D53]/10">
              <TabsTrigger
                value="login"
                className="rounded-lg text-[#0B4D53]/65 data-active:bg-white data-active:text-[#0B4D53] data-active:shadow-sm"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg text-[#0B4D53]/65 data-active:bg-white data-active:text-[#0B4D53] data-active:shadow-sm"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5 flex flex-col gap-3 outline-none">
              {loginBanner ? (
                <Alert variant={needsVerify ? "default" : "destructive"}>
                  <AlertTitle className="text-sm">{needsVerify ? "Verify your email" : "Sign in"}</AlertTitle>
                  <AlertDescription className="text-xs leading-relaxed">{loginBanner}</AlertDescription>
                  {needsVerify ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={verifySending}
                        onClick={handleResendVerification}
                        className="gap-1.5"
                      >
                        {verifySending ? <Loader2 className="size-3.5 animate-spin" /> : <MailCheck className="size-3.5" />}
                        Resend verification
                      </Button>
                    </div>
                  ) : null}
                </Alert>
              ) : null}

              {showForgot ? (
                <form
                  onSubmit={handleForgot}
                  className="flex flex-col gap-3 rounded-xl border border-[#0B4D53]/10 bg-white/70 p-4"
                >
                  <p className="text-sm font-medium text-[#0B4D53]">Reset password</p>
                  {forgotBanner ? (
                    <Alert variant={forgotSuccess ? "default" : "destructive"}>
                      <AlertDescription className="text-xs">{forgotBanner}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className={authLabelClass}>
                      Email
                    </Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={cn(authInputClass, forgotErrors.email ? "border-destructive" : "")}
                      aria-invalid={!!forgotErrors.email}
                    />
                    {forgotErrors.email ? (
                      <p className="text-xs text-destructive">{forgotErrors.email}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="submit" size="sm" disabled={forgotPending} className={cn(primaryAuthButtonClass, "mt-0 h-9 w-full px-4 sm:w-auto")}>
                      {forgotPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      Send link
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowForgot(false)}>
                      Back
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="flex flex-col gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-email" className={authLabelClass}>
                      Email
                    </Label>
                    <Input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={cn(authInputClass, loginErrors.email ? "border-destructive" : "")}
                      aria-invalid={!!loginErrors.email}
                    />
                    {loginErrors.email ? (
                      <p className="text-xs text-destructive">{loginErrors.email}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-password" className={authLabelClass}>
                      Password
                    </Label>
                    <PasswordInput
                      id="auth-password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={cn(authInputClass, loginErrors.password ? "border-destructive" : "")}
                      aria-invalid={!!loginErrors.password}
                    />
                    {loginErrors.password ? (
                      <p className="text-xs text-destructive">{loginErrors.password}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <button
                      type="button"
                      className="text-xs text-[#0B4D53]/65 underline-offset-4 hover:text-[#0B4D53] hover:underline"
                      onClick={() => {
                        setShowForgot(true);
                        setForgotEmail(loginEmail);
                        setForgotBanner(null);
                        setForgotSuccess(false);
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" className={primaryAuthButtonClass} size="lg" disabled={loginPending}>
                    {loginPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Signing in…</span>
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="register" className="mt-5 flex min-h-0 flex-1 flex-col gap-3 outline-none">
              {regDone ? (
                <Alert>
                  <AlertTitle className="text-sm">Check your email</AlertTitle>
                  <AlertDescription className="text-xs leading-relaxed">
                    We sent a verification link to <span className="font-medium text-foreground">{loginEmail}</span>.
                    After verifying, return here and sign in on the Login tab.
                  </AlertDescription>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setTab("login")}>
                      Go to login
                    </Button>
                  </div>
                </Alert>
              ) : (
                <>
                  {regBanner ? (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">{regBanner}</AlertDescription>
                    </Alert>
                  ) : null}
                  <form onSubmit={handleRegister} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <ScrollArea className="h-[min(52vh,400px)] min-h-0 w-full">
                      <div className="flex flex-col gap-3 pr-3 pb-1">
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-name" className={authLabelClass}>
                            Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="reg-name"
                            autoComplete="name"
                            placeholder="Your name"
                            value={regName}
                            required
                            onChange={(e) => setRegName(e.target.value)}
                            className={cn(authInputClass, regErrors.name ? "border-destructive" : "")}
                            aria-invalid={!!regErrors.name}
                          />
                          {regErrors.name ? <p className="text-xs text-destructive">{regErrors.name}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-email" className={authLabelClass}>
                            Email <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="reg-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={regEmail}
                            required
                            onChange={(e) => setRegEmail(e.target.value)}
                            className={cn(authInputClass, regErrors.email ? "border-destructive" : "")}
                            aria-invalid={!!regErrors.email}
                          />
                          {regErrors.email ? <p className="text-xs text-destructive">{regErrors.email}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-phone-local" className={authLabelClass}>
                            Phone number <span className="text-destructive">*</span>
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="reg-country-code"
                              type="tel"
                              inputMode="tel"
                              autoComplete="tel-country-code"
                              placeholder="+966"
                              value={regCountryCode}
                              required
                              maxLength={4}
                              onChange={(e) => {
                                const next = sanitizeCountryCode(e.target.value);
                                setRegCountryCode(next);
                                setRegPhoneLocal((prev) =>
                                  sanitizePhoneLocal(prev, next || "+")
                                );
                              }}
                              className={cn(
                                authInputClass,
                                "w-[4.75rem] shrink-0 px-2 text-center text-sm sm:w-[5rem]",
                                regErrors.countryCode ? "border-destructive" : ""
                              )}
                              aria-label="Country code"
                              aria-invalid={!!regErrors.countryCode}
                            />
                            <Input
                              id="reg-phone-local"
                              type="tel"
                              inputMode="numeric"
                              autoComplete="tel-national"
                              placeholder="501234567"
                              value={regPhoneLocal}
                              required
                              maxLength={phoneMaxDigits}
                              onChange={(e) =>
                                setRegPhoneLocal(
                                  sanitizePhoneLocal(
                                    e.target.value,
                                    normalizedCountryCode || "+"
                                  )
                                )
                              }
                              className={cn(
                                authInputClass,
                                "min-w-0 flex-1",
                                regErrors.phoneNumber ? "border-destructive" : ""
                              )}
                              aria-invalid={!!regErrors.phoneNumber}
                            />
                          </div>
                          <p className="text-[0.65rem] leading-snug text-[#0B4D53]/55">
                            Enter country code with +, then local digits only
                            {normalizedCountryCode
                              ? ` (${phoneMinDigits}–${phoneMaxDigits} local digits).`
                              : "."}
                          </p>
                          {regErrors.countryCode ? (
                            <p className="text-xs text-destructive">{regErrors.countryCode}</p>
                          ) : null}
                          {regErrors.phoneNumber ? (
                            <p className="text-xs text-destructive">{regErrors.phoneNumber}</p>
                          ) : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-password" className={authLabelClass}>
                            Password <span className="text-destructive">*</span>
                          </Label>
                          <PasswordInput
                            id="reg-password"
                            autoComplete="new-password"
                            placeholder="8+ chars, upper, lower, number"
                            value={regPassword}
                            required
                            minLength={8}
                            maxLength={128}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className={cn(authInputClass, regErrors.password ? "border-destructive" : "")}
                            aria-invalid={!!regErrors.password}
                          />
                          {regErrors.password ? (
                            <p className="text-xs text-destructive">{regErrors.password}</p>
                          ) : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-confirm-password" className={authLabelClass}>
                            Confirm password <span className="text-destructive">*</span>
                          </Label>
                          <PasswordInput
                            id="reg-confirm-password"
                            autoComplete="new-password"
                            placeholder="Re-enter your password"
                            value={regConfirmPassword}
                            required
                            minLength={8}
                            maxLength={128}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className={cn(
                              authInputClass,
                              regErrors.confirmPassword ? "border-destructive" : ""
                            )}
                            aria-invalid={!!regErrors.confirmPassword}
                          />
                          {regErrors.confirmPassword ? (
                            <p className="text-xs text-destructive">{regErrors.confirmPassword}</p>
                          ) : null}
                        </div>
                      </div>
                    </ScrollArea>

                    <div className="mt-3 shrink-0 space-y-3 border-t border-[#0B4D53]/10 bg-[#FAF6F0] pt-3">
                      <Button type="submit" className={cn(primaryAuthButtonClass, "mt-0")} size="lg" disabled={regPending}>
                        {regPending ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            <span>Creating account…</span>
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>

                      {regToast ? (
                        <div
                          role="status"
                          aria-live="polite"
                          className={cn(
                            "mx-auto w-full rounded-xl px-4 py-3 text-center text-sm leading-relaxed shadow-md ring-1",
                            authToastClass[regToast.variant]
                          )}
                        >
                          {regToast.text}
                        </div>
                      ) : null}

                      <p className="text-center text-[11px] leading-relaxed text-gray-500">
                        By creating an account, you agree that your events will comply with our community
                        safety and verification guidelines.
                      </p>
                    </div>
                  </form>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
