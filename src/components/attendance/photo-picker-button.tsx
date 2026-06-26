"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoPickerButtonProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function PhotoPickerButton({ onFile, disabled }: PhotoPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (ref: React.RefObject<HTMLInputElement | null>) => {
    setOpen(false);
    ref.current?.click();
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Main trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all",
          "bg-tunet-green/15 text-tunet-green border border-tunet-green/30",
          "hover:bg-tunet-green/25 hover:border-tunet-green/50",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <Camera className="h-4 w-4" />
        Ambil / Upload Foto
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute left-0 mt-2 w-52 rounded-xl border border-tunet-border bg-tunet-surface shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Camera option */}
          <button
            type="button"
            onClick={() => handleSelect(cameraRef)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-tunet-text hover:bg-tunet-green/10 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tunet-green/15">
              <Camera className="h-4 w-4 text-tunet-green" />
            </div>
            <div>
              <p className="font-medium">Ambil Foto</p>
              <p className="text-[11px] text-tunet-text-muted">Gunakan kamera</p>
            </div>
          </button>

          {/* Divider */}
          <div className="h-px bg-tunet-border" />

          {/* Upload option */}
          <button
            type="button"
            onClick={() => handleSelect(uploadRef)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-tunet-text hover:bg-tunet-green/10 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tunet-ember/15">
              <ImageIcon className="h-4 w-4 text-tunet-ember" />
            </div>
            <div>
              <p className="font-medium">Upload dari Galeri</p>
              <p className="text-[11px] text-tunet-text-muted">Pilih dari galeri foto</p>
            </div>
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          if (cameraRef.current) cameraRef.current.value = "";
        }}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          if (uploadRef.current) uploadRef.current.value = "";
        }}
      />
    </div>
  );
}
