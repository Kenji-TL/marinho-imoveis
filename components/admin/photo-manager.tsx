"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Camera, ImagePlus, Loader2, RotateCcw, Star, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { discardUploadedPhoto, uploadPhoto } from "@/lib/admin/api";
import { compressImage } from "@/lib/image-compress";
import { MAX_PHOTOS } from "@/lib/property-options";
import { buttonSecondary } from "./ui";

export type PhotoItem = {
  id: string;
  storage_path: string | null;
  preview: string;
  width: number | null;
  height: number | null;
  status: "uploading" | "done" | "error";
  error?: string;
  /** já cadastrada no banco (veio do imóvel salvo) */
  saved: boolean;
};

const CONCURRENCY = 3;

export function PhotoManager({
  getPropertyId,
  photos,
  setPhotos,
  coverId,
  setCoverId,
  error,
}: {
  getPropertyId: () => string;
  photos: PhotoItem[];
  setPhotos: Dispatch<SetStateAction<PhotoItem[]>>;
  coverId: string | null;
  setCoverId: (id: string | null) => void;
  error?: string;
}) {
  const files = useRef(new Map<string, File>());
  const queue = useRef<string[]>([]);
  const active = useRef(0);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  const effectiveCover = coverId && photos.some((p) => p.id === coverId) ? coverId : photos[0]?.id ?? null;

  // Libera as pré-visualizações locais ao sair da página
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      photosRef.current.forEach((p) => p.preview.startsWith("blob:") && URL.revokeObjectURL(p.preview));
    },
    [],
  );

  const update = (id: string, patch: Partial<PhotoItem>) =>
    setPhotos((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function upload(id: string) {
    const file = files.current.get(id);
    if (!file) return;
    let compressed;
    try {
      compressed = await compressImage(file);
    } catch (e) {
      update(id, { status: "error", error: e instanceof Error ? e.message : "Imagem inválida." });
      return;
    }
    const path = `${getPropertyId()}/${id}.jpg`;
    try {
      await uploadPhoto(path, compressed.blob, compressed.small);
    } catch (e) {
      const offline = e instanceof Error && /conexão/i.test(e.message);
      update(id, { status: "error", error: offline ? "Sem conexão. Verifique a internet." : "Não foi possível enviar esta foto." });
      return;
    }
    files.current.delete(id);
    update(id, { status: "done", storage_path: path, width: compressed.width, height: compressed.height, error: undefined });
  }

  function pump() {
    while (active.current < CONCURRENCY && queue.current.length) {
      const id = queue.current.shift()!;
      active.current++;
      upload(id).finally(() => {
        active.current--;
        pump();
      });
    }
  }

  function addFiles(list: FileList | File[]) {
    const images = Array.from(list).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    const room = MAX_PHOTOS - photos.length;
    const accepted = images.slice(0, Math.max(0, room));
    setLimitWarning(
      images.length > accepted.length
        ? `Limite de ${MAX_PHOTOS} fotos por imóvel. ${images.length - accepted.length} foto(s) não foram adicionadas.`
        : null,
    );
    if (!accepted.length) return;

    const items: PhotoItem[] = accepted.map((file) => {
      const id = crypto.randomUUID();
      files.current.set(id, file);
      return {
        id,
        storage_path: null,
        preview: URL.createObjectURL(file),
        width: null,
        height: null,
        status: "uploading",
        saved: false,
      };
    });
    setPhotos((list) => [...list, ...items]);
    if (!effectiveCover) setCoverId(items[0].id);
    queue.current.push(...items.map((i) => i.id));
    pump();
  }

  function retry(id: string) {
    update(id, { status: "uploading", error: undefined });
    queue.current.push(id);
    pump();
  }

  function remove(photo: PhotoItem) {
    setPhotos((list) => list.filter((p) => p.id !== photo.id));
    if (photo.preview.startsWith("blob:")) URL.revokeObjectURL(photo.preview);
    files.current.delete(photo.id);
    queue.current = queue.current.filter((id) => id !== photo.id);
    if (effectiveCover === photo.id) setCoverId(photos.find((p) => p.id !== photo.id)?.id ?? null);
    // Foto nova, ainda não salva no imóvel: apaga o arquivo já enviado
    if (!photo.saved && photo.storage_path) {
      discardUploadedPhoto(getPropertyId(), photo.storage_path).catch(() => {});
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setPhotos((list) => {
      const from = list.findIndex((p) => p.id === active.id);
      const to = list.findIndex((p) => p.id === over.id);
      return arrayMove(list, from, to);
    });
  }

  const uploading = photos.filter((p) => p.status === "uploading").length;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragOver ? "border-marinho-700 bg-marinho-50" : "border-areia-300 bg-areia-100"
        }`}
      >
        <p className="hidden text-sm text-grafite-600 pointer-fine:block">Arraste as fotos para cá ou</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className={`${buttonSecondary} hidden pointer-coarse:inline-flex`} onClick={() => cameraInput.current?.click()}>
            <Camera className="size-4" aria-hidden /> Tirar foto
          </button>
          <button type="button" className={buttonSecondary} onClick={() => galleryInput.current?.click()}>
            <ImagePlus className="size-4" aria-hidden /> Escolher fotos
          </button>
        </div>
        <p className="text-xs text-grafite-600">
          JPG, PNG ou WebP. As fotos são comprimidas automaticamente. Até {MAX_PHOTOS} por imóvel.
        </p>
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {limitWarning && <p className="text-sm text-vermelho-700">{limitWarning}</p>}
      {error && <p className="text-sm text-vermelho-700">{error}</p>}

      {photos.length > 0 && (
        <>
          <p className="text-xs text-grafite-600" aria-live="polite">
            {uploading > 0
              ? `Enviando ${uploading} foto(s)…`
              : `${photos.length} foto(s). Arraste para mudar a ordem (no celular, segure a foto antes de arrastar). A estrela define a capa.`}
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((photo, index) => (
                  <SortablePhoto
                    key={photo.id}
                    photo={photo}
                    index={index}
                    isCover={photo.id === effectiveCover}
                    onCover={() => setCoverId(photo.id)}
                    onRemove={() => remove(photo)}
                    onRetry={() => retry(photo.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}

function SortablePhoto({
  photo,
  index,
  isCover,
  onCover,
  onRemove,
  onRetry,
}: {
  photo: PhotoItem;
  index: number;
  isCover: boolean;
  onCover: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative aspect-[4/3] touch-manipulation overflow-hidden rounded-lg border bg-areia-200 ${
        isCover ? "border-marinho-700 ring-2 ring-marinho-700" : "border-areia-300"
      } ${isDragging ? "z-10 opacity-80 shadow-xl" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        aria-label={`Foto ${index + 1}${isCover ? " (capa)" : ""}. Use espaço e as setas para mover.`}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- pré-visualização local (blob) */}
        <img src={photo.preview} alt="" className="size-full object-cover" draggable={false} />
      </div>

      {isCover && (
        <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-marinho-700 px-2 py-0.5 text-xs font-semibold text-white">
          Capa
        </span>
      )}

      {photo.status === "uploading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Loader2 className="size-7 animate-spin text-marinho-700" aria-label="Enviando" />
        </div>
      )}

      {photo.status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90 p-2 text-center">
          <TriangleAlert className="size-5 text-vermelho-600" aria-hidden />
          <p className="line-clamp-2 text-xs text-vermelho-700">{photo.error}</p>
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 text-xs font-semibold text-marinho-700">
            <RotateCcw className="size-3.5" aria-hidden /> Tentar de novo
          </button>
        </div>
      )}

      <div className="absolute right-2 bottom-2 flex gap-1.5">
        {!isCover && photo.status === "done" && (
          <button
            type="button"
            onClick={onCover}
            title="Usar como capa"
            aria-label={`Usar a foto ${index + 1} como capa`}
            className="flex size-9 items-center justify-center rounded-full bg-white/95 text-marinho-700 shadow transition hover:bg-marinho-700 hover:text-white"
          >
            <Star className="size-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          title="Remover foto"
          aria-label={`Remover a foto ${index + 1}`}
          className="flex size-9 items-center justify-center rounded-full bg-white/95 text-vermelho-700 shadow transition hover:bg-vermelho-600 hover:text-white"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

