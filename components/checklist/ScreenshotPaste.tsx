"use client";

import { useRef, useState } from "react";

interface ScreenshotPasteProps {
  previewUrl: string | null;
  uploading: boolean;
  onImage: (file: Blob) => void;
  onClear: () => void;
}

export function ScreenshotPaste({
  previewUrl,
  uploading,
  onImage,
  onClear,
}: ScreenshotPasteProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function processFile(file: File | Blob | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    onImage(file);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();

        if (file) {
          e.preventDefault();
          processFile(file);
        }

        return;
      }
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];

    processFile(file ?? null);
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] ?? null;

    processFile(file);

    // Permite volver a seleccionar el mismo archivo
    e.target.value = "";
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-ink-soft">
        Evidencia
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex min-h-[130px] flex-col items-center justify-center rounded-card border-2 border-dashed p-3 text-center outline-none transition ${
          dragOver
            ? "border-accent bg-accent-soft"
            : "border-line bg-bg"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <p className="font-mono text-xs text-ink-soft">
              Subiendo imagen…
            </p>

            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-line">
              <div className="h-full w-2/3 animate-pulse bg-accent" />
            </div>
          </div>
        ) : previewUrl ? (
          <div className="flex w-full flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Evidencia adjunta"
              className="max-h-40 max-w-full rounded-md border border-line object-contain"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={openFilePicker}
                className="font-mono text-[11px] uppercase tracking-wide text-accent hover:underline"
              >
                Reemplazar
              </button>

              <button
                type="button"
                onClick={onClear}
                className="font-mono text-[11px] uppercase tracking-wide text-danger hover:underline"
              >
                Quitar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-ink">
              Adjunta una evidencia
            </p>

            <p className="mt-1 text-xs text-ink-soft">
              Pega una captura con{" "}
              <span className="font-mono">Ctrl+V</span> o{" "}
              <span className="font-mono">Cmd+V</span>
            </p>

            <p className="mt-1 text-xs text-ink-soft/70">
              También puedes arrastrar una imagen aquí
            </p>

            <button
              type="button"
              onClick={openFilePicker}
              className="mt-3 rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium text-ink transition hover:border-accent"
            >
              Seleccionar imagen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}