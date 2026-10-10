"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !pending) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 shadow-2xl backdrop:bg-marinho-950/50"
    >
      <div className="p-6">
        <h2 className="font-serif text-xl text-marinho-950">{title}</h2>
        <div className="mt-2 text-sm text-grafite-700">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-areia-300 px-4 py-2.5 text-sm font-semibold text-grafite-900 hover:border-grafite-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-lg bg-vermelho-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-vermelho-700 disabled:opacity-60"
          >
            {pending ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
