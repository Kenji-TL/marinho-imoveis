"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NewPasswordForm } from "./new-password-form";

/** Esta página abre logo depois do link do e-mail, que já deixou a pessoa logada */
export function WithLinkSession() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) setEmail(data.session.user.email ?? "");
        else router.replace("/admin/login?next=/admin/definir-senha");
      });
  }, [router]);

  if (email === null) return <div className="h-48 animate-pulse rounded-lg bg-areia-100" aria-hidden />;
  return <NewPasswordForm email={email} />;
}
