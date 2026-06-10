"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   value: File | null;
 *   onChange: (file: File | null) => void;
 *   accept?: string;
 *   maxSizeMb?: number;
 *   className?: string;
 *   error?: string;
 *   hint?: string;
 * }} props
 */
export function ImageUploadBox({
  value,
  onChange,
  accept = "image/*",
  maxSizeMb = 2,
  className,
  error,
  hint = "PNG or JPEG, up to 2MB",
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState("");

  const previewUrl = useMemo(() => {
    if (!value) return null;
    return URL.createObjectURL(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function validateAndSet(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Please choose an image file.");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setLocalError(`Image must be ${maxSizeMb}MB or smaller.`);
      return;
    }
    setLocalError("");
    onChange(file);
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  }

  const displayError = error || localError;

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleInputChange}
      />

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20">
          <Image
            src={previewUrl}
            alt="Event banner preview"
            width={640}
            height={320}
            unoptimized
            className="max-h-40 w-full object-cover sm:max-h-52"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute right-2 top-2 size-8 rounded-full shadow-sm"
            onClick={() => {
              setLocalError("");
              onChange(null);
            }}
            aria-label="Remove image"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors sm:gap-3 sm:px-6 sm:py-10",
            "hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/15",
            displayError ? "border-[#0B4D53]/70" : ""
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="size-5" aria-hidden />
          </span>
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">
              Drop an image here, or <span className="text-primary">browse</span>
            </span>
            <span className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ImageIcon className="size-3.5" aria-hidden />
              {hint}
            </span>
          </span>
        </button>
      )}

      {previewUrl ? (
        <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => inputRef.current?.click()}>
          Replace image
        </Button>
      ) : null}

      {displayError ? <p className="text-xs text-[#0B4D53]">{displayError}</p> : null}
    </div>
  );
}
