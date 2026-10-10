import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Encerra a sessão de uma conta logada que não é admin e volta ao login com aviso.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const loginUrl = new URL("/admin/login", request.url);
  if (request.nextUrl.searchParams.get("motivo") === "sem-acesso") {
    loginUrl.searchParams.set("erro", "sem-acesso");
  }
  return NextResponse.redirect(loginUrl);
}
