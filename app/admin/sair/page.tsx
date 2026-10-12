"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Encerra a sessão e volta para a tela de entrada
export default function LogoutPage() {
  useEffect(() => {
    createClient()
      .auth.signOut()
      .finally(() => window.location.replace("/admin/login"));
  }, []);
  return <p className="py-20 text-center text-grafite-600">Saindo…</p>;
}
