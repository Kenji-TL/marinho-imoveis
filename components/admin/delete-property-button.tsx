"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteProperty } from "@/lib/admin/api";
import { ConfirmDialog } from "./confirm-dialog";

export function DeletePropertyButton({
  id,
  title,
  onDeleted,
}: {
  id: string;
  title: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-vermelho-700 hover:underline"
      >
        <Trash2 className="size-4" aria-hidden /> Excluir este imóvel
      </button>
      <ConfirmDialog
        open={open}
        title="Excluir imóvel?"
        confirmLabel="Excluir"
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteProperty(id);
            if (!result.ok) {
              setError(result.message);
              return;
            }
            setOpen(false);
            onDeleted();
          })
        }
      >
        <p>
          <strong>{title || "Este imóvel"}</strong> e todas as fotos serão apagados de vez. Para tirar do site sem
          apagar, use <em>Mostrar no site</em>.
        </p>
        {error && <p className="mt-2 text-vermelho-700">{error}</p>}
      </ConfirmDialog>
    </>
  );
}
