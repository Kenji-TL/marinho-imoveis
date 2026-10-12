"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Carrega dados no navegador. Passe uma função estável (useCallback): quando
 * ela muda (ex.: filtros), busca de novo. reload() busca de novo mantendo os
 * dados atuais na tela, como depois de salvar algo.
 */
export function useLoad<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; error?: string; source?: () => Promise<T> }>({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    load().then(
      (data) => alive && setState({ data, source: load }),
      (e: unknown) =>
        alive && setState((s) => ({ ...s, source: load, error: e instanceof Error ? e.message : "Erro ao carregar." })),
    );
    return () => {
      alive = false;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data: state.data, error: state.error, loading: state.source !== load, reload };
}
