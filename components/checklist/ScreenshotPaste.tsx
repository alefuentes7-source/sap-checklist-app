"use client";

import { useRef, useState } from "react";

export interface ScreenshotEvidence {
  id: string;
  previewUrl: string | null;
  storagePath: string;
}

interface ScreenshotPasteProps {
  evidences: ScreenshotEvidence[];
  uploading: boolean;
  onImage: (file: Blob) => void;
  onRemove: (evidenceId: string) => void;
}

export function ScreenshotPaste({
  evidences,
  uploading,
  onImage,
  onRemove,
}: ScreenshotPasteProps) {
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  function processFile(
    file: File | Blob | null
  ) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    onImage(file);
  }

  function processFiles(
    files: FileList | null
  ) {
    if (!files) return;

    Array.from(files).forEach((file) => {
      processFile(file);
    });
  }

  function handlePaste(
    e: React.ClipboardEvent<HTMLDivElement>
  ) {
    const items =
      e.clipboardData?.items;

    if (!items) return;

    let imageFound = false;

    for (const item of items) {
      if (
        item.type.startsWith("image/")
      ) {
        const file =
          item.getAsFile();

        if (file) {
          imageFound = true;
          processFile(file);
        }
      }
    }

    if (imageFound) {
      e.preventDefault();
    }
  }

  function handleDrop(
    e: React.DragEvent<HTMLDivElement>
  ) {
    e.preventDefault();

    setDragOver(false);

    processFiles(
      e.dataTransfer.files
    );
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    processFiles(
      e.target.files
    );

    /*
     * Permite volver a seleccionar
     * el mismo archivo.
     */
    e.target.value = "";
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-soft">
          Evidencias
        </p>

        {evidences.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-wide text-ink-soft">
            {evidences.length}{" "}
            {evidences.length === 1
              ? "imagen"
              : "imágenes"}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/*
       * Imágenes ya agregadas.
       */}
      {evidences.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {evidences.map(
            (evidence, index) => (
              <div
                key={evidence.id}
                className="relative overflow-hidden rounded-md border border-line bg-surface"
              >
                <div className="flex aspect-square items-center justify-center bg-bg p-2">
                  {evidence.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        evidence.previewUrl
                      }
                      alt={`Evidencia ${
                        index + 1
                      }`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-center">
                      <span className="text-xl">
                        🖼️
                      </span>

                      <p className="font-mono text-[10px] text-ink-soft">
                        Evidencia{" "}
                        {index + 1}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-line px-2 py-1.5">
                  <span className="font-mono text-[10px] text-ink-soft">
                    #{index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      onRemove(
                        evidence.id
                      )
                    }
                    className="font-mono text-[10px] uppercase tracking-wide text-danger hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/*
       * Área para agregar nuevas imágenes.
       *
       * Sigue visible aunque ya existan
       * evidencias, por lo que el operador
       * puede continuar agregando más.
       */}
      <div
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() =>
          setDragOver(false)
        }
        onDrop={handleDrop}
        className={`flex min-h-[115px] flex-col items-center justify-center rounded-card border-2 border-dashed p-3 text-center outline-none transition ${
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
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-ink">
              {evidences.length > 0
                ? "Agregar otra evidencia"
                : "Adjunta una evidencia"}
            </p>

            <p className="mt-1 text-xs text-ink-soft">
              Pega una captura con{" "}
              <span className="font-mono">
                Ctrl+V
              </span>{" "}
              o{" "}
              <span className="font-mono">
                Cmd+V
              </span>
            </p>

            <p className="mt-1 text-xs text-ink-soft/70">
              También puedes arrastrar
              una o varias imágenes aquí
            </p>

            <button
              type="button"
              onClick={openFilePicker}
              className="mt-3 rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium text-ink transition hover:border-accent"
            >
              Seleccionar imágenes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}