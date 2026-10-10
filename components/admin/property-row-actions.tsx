"use client";

import { Copy, Eye, EyeOff, ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteProperty, duplicateProperty, setPropertyVisibility } from "@/app/admin/(painel)/imoveis/actions";
import { ConfirmDialog } from "./confirm-dialog";

export function PropertyRowActions({
  id,
  slug,
  title,
  visible,
}: {
  id: string;
  slug: string;
  title: string;
  visible: boolean;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  const run = (fn: () => Promise<{ ok: boolean; message?: string } | void>) => {
    setMenuOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result && !result.ok) setError(result.message ?? "Algo deu errado.");
      else router.refresh();
    });
  };

  const item = "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-grafite-900 hover:bg-areia-100";

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/admin/imoveis/${id}`}
        className="hidden items-center gap-1.5 rounded-lg border border-areia-300 px-3 py-2 text-sm font-semibold text-marinho-700 hover:border-marinho-700 sm:inline-flex"
      >
        <Pencil className="size-4" aria-hidden /> Editar
      </Link>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          disabled={pending}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`Mais ações para ${title}`}
          className="flex size-9 items-center justify-center rounded-lg text-grafite-700 hover:bg-areia-200 disabled:opacity-50"
        >
          <MoreVertical className={`size-5 ${pending ? "animate-pulse" : ""}`} aria-hidden />
        </button>
        {menuOpen && (
          <div role="menu" className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-areia-300 bg-white py-1 shadow-lg">
            <button role="menuitem" type="button" className={item} onClick={() => run(() => duplicateProperty(id))}>
              <Copy className="size-4 text-grafite-600" aria-hidden /> Duplicar
            </button>
            <button role="menuitem" type="button" className={item} onClick={() => run(() => setPropertyVisibility(id, !visible))}>
              {visible ? <EyeOff className="size-4 text-grafite-600" aria-hidden /> : <Eye className="size-4 text-grafite-600" aria-hidden />}
              {visible ? "Ocultar do site" : "Mostrar no site"}
            </button>
            {visible && (
              <a role="menuitem" href={`/imovel/${slug}`} target="_blank" className={item}>
                <ExternalLink className="size-4 text-grafite-600" aria-hidden /> Ver no site
              </a>
            )}
            <button
              role="menuitem"
              type="button"
              className={`${item} text-vermelho-700`}
              onClick={() => {
                setMenuOpen(false);
                setConfirmDelete(true);
              }}
            >
              <Trash2 className="size-4" aria-hidden /> Excluir
            </button>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-vermelho-700">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir imóvel?"
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteProperty(id);
            setConfirmDelete(false);
            if (!result.ok) setError(result.message);
            else router.refresh();
          })
        }
      >
        <p>
          <strong>{title}</strong> e todas as fotos serão apagados de vez. Para tirar do site sem apagar, use{" "}
          <em>Ocultar do site</em>.
        </p>
      </ConfirmDialog>
    </div>
  );
}
