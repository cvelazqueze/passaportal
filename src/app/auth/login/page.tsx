"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { CANDIDATE_APP_DASHBOARD, isAllowedCallbackUrl } from "@/lib/candidate-only";
import { PublicBrandLink } from "@/components/public-brand-link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useT } from "@/components/locale-provider";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const t = useT();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "candidateOnly") {
      setError(t.auth.candidateOnly);
      void signOut({ redirect: false });
    }
  }, [searchParams, t.auth.candidateOnly]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const callbackUrl = searchParams.get("callbackUrl");
    const destination =
      callbackUrl && isAllowedCallbackUrl(callbackUrl)
        ? callbackUrl
        : CANDIDATE_APP_DASHBOARD;

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: destination,
      redirect: false,
    });

    if (result?.error || result?.ok === false) {
      setError(t.auth.invalidCredentials);
      setLoading(false);
      return;
    }

    // Let NextAuth finish the redirect after the session cookie is set.
    window.location.href = result?.url ?? destination;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-muted/50 px-4">
      <header className="container mx-auto flex h-16 items-center justify-between py-4">
        <PublicBrandLink />
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center pb-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.auth.backToHome}
          </Link>
          <CardTitle>{t.auth.welcomeBack}</CardTitle>
          <CardDescription>{t.auth.signInSubtitle}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t.auth.emailPlaceholder}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.auth.signingIn : t.auth.signIn}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t.auth.noAccount}{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                {t.auth.createOne}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  );
}
