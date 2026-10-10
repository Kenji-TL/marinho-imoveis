"use client";

import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";

type Photo = { id: string; url: string; width: number | null; height: number | null };

function useSwipe(onPrev: () => void, onNext: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: TouchEvent) => {
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e: TouchEvent) => {
      if (!start.current) return;
      const dx = e.changedTouches[0].clientX - start.current.x;
      const dy = e.changedTouches[0].clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) (dx > 0 ? onPrev : onNext)();
    },
  };
}

export function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = photos.length;
  const thumbs = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const swipe = useSwipe(prev, next);

  // Mantém a miniatura atual visível
  useEffect(() => {
    const el = thumbs.current?.children[index] as HTMLElement | undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "center" });
  }, [index]);

  // Tela cheia: teclado, trava de rolagem e foco
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const back = opener.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      back?.focus();
    };
  }, [lightbox, prev, next]);

  if (!count) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-areia-200 text-grafite-600">
        <ImageOff className="size-10" aria-label="Imóvel sem fotos" />
      </div>
    );
  }

  const current = photos[index];
  const arrow =
    "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-marinho-950 shadow-md transition hover:bg-white";

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-areia-200 sm:aspect-[16/10]" {...swipe}>
        <button
          ref={opener}
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute inset-0 cursor-zoom-in"
          aria-label={`Ampliar foto ${index + 1} de ${count}`}
        >
          <Image
            key={current.id}
            src={current.url}
            alt={`${title} — foto ${index + 1} de ${count}`}
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            className="object-cover motion-safe:animate-[fade_.35s_ease-out]"
          />
        </button>
        {count > 1 && (
          <>
            <button type="button" onClick={prev} className={`${arrow} left-3 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100`} aria-label="Foto anterior">
              <ChevronLeft className="size-6" aria-hidden />
            </button>
            <button type="button" onClick={next} className={`${arrow} right-3 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100`} aria-label="Próxima foto">
              <ChevronRight className="size-6" aria-hidden />
            </button>
          </>
        )}
        <div className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-2">
          <span className="rounded-full bg-grafite-900/75 px-3 py-1 text-xs font-medium text-white tabular-nums">
            {index + 1} / {count}
          </span>
          <span className="hidden items-center gap-1.5 rounded-full bg-grafite-900/75 px-3 py-1 text-xs font-medium text-white sm:flex">
            <Expand className="size-3.5" aria-hidden /> Tela cheia
          </span>
        </div>
      </div>

      {count > 1 && (
        <div ref={thumbs} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === index}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition sm:h-20 sm:w-28 ${
                i === index ? "ring-2 ring-marinho-700 ring-offset-2" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={photo.url} alt="" fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label={`Fotos de ${title}`} data-surface="dark" className="fixed inset-0 z-[60] flex flex-col bg-black/95">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm tabular-nums">
              {index + 1} / {count}
            </span>
            <button
              ref={closeButton}
              type="button"
              onClick={() => setLightbox(false)}
              className="flex size-11 items-center justify-center rounded-full hover:bg-white/10"
              aria-label="Fechar"
            >
              <X className="size-6" aria-hidden />
            </button>
          </div>
          <div className="relative flex-1" {...swipe}>
            <Image
              key={`lb-${current.id}`}
              src={current.url}
              alt={`${title} — foto ${index + 1} de ${count}`}
              fill
              sizes="100vw"
              className="object-contain motion-safe:animate-[fade_.3s_ease-out]"
            />
            {count > 1 && (
              <>
                <button type="button" onClick={prev} className={`${arrow} left-2 sm:left-6`} aria-label="Foto anterior">
                  <ChevronLeft className="size-6" aria-hidden />
                </button>
                <button type="button" onClick={next} className={`${arrow} right-2 sm:right-6`} aria-label="Próxima foto">
                  <ChevronRight className="size-6" aria-hidden />
                </button>
              </>
            )}
          </div>
          {count > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md ${i === index ? "ring-2 ring-white" : "opacity-50 hover:opacity-90"}`}
                >
                  <Image src={photo.url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
