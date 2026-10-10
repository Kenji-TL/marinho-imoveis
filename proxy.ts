import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/admin/login";
const LOGOUT_PATH = "/admin/sair";
// Abertas para quem ainda não entrou
const PUBLIC_PATHS = [LOGIN_PATH, "/admin/recuperar-senha"];

/**
 * Roda só nas rotas /admin: renova a sessão do Supabase e faz a checagem
 * otimista de login. A checagem definitiva (se a conta é admin) acontece
 * no servidor, em lib/auth.ts, e no banco, via RLS.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // Não colocar código entre createServerClient e getClaims: é aqui que a
  // sessão é validada e, se preciso, renovada.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims?.sub);

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === LOGIN_PATH;
  const isPublic = PUBLIC_PATHS.includes(pathname);
  // /admin/sair encerra a sessão e já redireciona por conta própria
  if (pathname === LOGOUT_PATH) return response;

  if (!isLoggedIn && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return redirectWithCookies(loginUrl, response);
  }

  if (isLoggedIn && isLoginPage) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    return redirectWithCookies(adminUrl, response);
  }

  return response;
}

// Mantém os cookies de sessão renovados também nos redirecionamentos
function redirectWithCookies(target: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(target);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
