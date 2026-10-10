"use client";

import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WhatsappIcon } from "./whatsapp-icon";

const LINKS = [
  { href: "/", label: "Início", exact: true },
  { href: "/comprar", label: "Comprar" },
  { href: "/alugar", label: "Alugar" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

type Props = { whatsappHref: string; phone: string | null };

/** Menu com a página atual destacada (lê a URL, por isso fica dentro de Suspense) */
export function HeaderNav(props: Props) {
  return <HeaderNavLinks pathname={usePathname()} {...props} />;
}

export function HeaderNavLinks({ pathname, whatsappHref, phone }: Props & { pathname: string | null }) {
  const [open, setOpen] = useState(false);

  // Fecha o menu do celular ao trocar de página
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);

  // Menu aberto: foco entra no menu, Tab fica preso dentro dele e, ao fechar,
  // volta para o botão que abriu
  useEffect(() => {
    if (!open) return;
    const opener = menuButton.current;
    const focusables = () =>
      [...(drawer.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [])];
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, [open]);

  const isActive = (href: string, exact?: boolean) =>
    pathname != null && (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const tel = phone ? `tel:+55${phone.replace(/\D/g, "")}` : null;

  return (
    <>
      <nav aria-label="Principal" className="hidden flex-1 items-center justify-center gap-1 md:flex">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href, link.exact) ? "page" : undefined}
            className="relative px-3 py-2 text-sm font-medium text-grafite-700 transition hover:text-marinho-950 aria-[current=page]:font-semibold aria-[current=page]:text-marinho-950 aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3 aria-[current=page]:after:-bottom-0.5 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-dourado-400"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto hidden items-center gap-5 md:flex">
        {tel && (
          <a href={tel} className="hidden items-center gap-2 text-sm font-semibold text-marinho-950 lg:flex">
            <Phone className="size-4 text-dourado-500" aria-hidden /> {phone}
          </a>
        )}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-marinho-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-marinho-800"
        >
          <WhatsappIcon className="size-4" /> Fale conosco
        </a>
      </div>

      <button
        ref={menuButton}
        type="button"
        onClick={() => setOpen(true)}
        className="-mr-2 ml-auto flex size-11 items-center justify-center rounded-lg text-marinho-950 md:hidden"
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="menu-celular"
      >
        <Menu className="size-6" aria-hidden />
      </button>

      {open && (
        <div id="menu-celular" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 md:hidden">
          <button type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-0 bg-marinho-950/60" onClick={() => setOpen(false)} />
          <div ref={drawer} className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-areia-100 shadow-2xl">
            <div className="flex h-16 items-center justify-end px-4">
              <button type="button" onClick={() => setOpen(false)} className="flex size-11 items-center justify-center rounded-lg" aria-label="Fechar menu">
                <X className="size-6" aria-hidden />
              </button>
            </div>
            <nav aria-label="Principal" className="flex flex-col px-6">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href, link.exact) ? "page" : undefined}
                  className="border-b border-areia-300 py-4 font-serif text-2xl text-marinho-950 aria-[current=page]:text-dourado-700"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-3 p-6">
              {tel && (
                <a href={tel} className="flex items-center justify-center gap-2 rounded-full border border-areia-300 bg-white px-4 py-3.5 font-semibold text-marinho-950">
                  <Phone className="size-4" aria-hidden /> {phone}
                </a>
              )}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-marinho-950 px-4 py-3.5 font-semibold text-white"
              >
                <WhatsappIcon className="size-5" /> Fale conosco
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
