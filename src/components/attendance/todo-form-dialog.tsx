"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { X, Plus, ListTodo, Loader2, Trash2 } from "lucide-react";
import { COPY } from "@/lib/copy";
import { PhotoPickerButton } from "./photo-picker-button";

interface TodoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (todos: string[], photo: File | null) => void;
}

/**
 * Downscale a photo using createImageBitmap (hardware-accelerated decode
 * at target size). Unlike new Image() + createObjectURL which decodes
 * the FULL 50MP image into ~200MB of RAM before drawing to canvas,
 * createImageBitmap with resizeWidth decodes directly at target size.
 * This prevents OOM crashes on Samsung S-series and other high-res phones.
 */
async function downscaleImage(
  file: File,
  maxDim = 1024
): Promise<{ preview: string; file: File }> {
  const bitmap = await createImageBitmap(file, {
    resizeWidth: maxDim,
    resizeHeight: maxDim,
    resizeQuality: "medium",
    imageOrientation: "from-image",
  });

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close(); // Release decoded bitmap from memory immediately

  const preview = canvas.toDataURL("image/jpeg", 0.7);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8)
  );
  const downscaledFile = new File([blob], file.name, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return { preview, file: downscaledFile };
}

export function TodoFormDialog({ open, onOpenChange, onSubmit }: TodoFormDialogProps) {
  const [items, setItems] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePhotoSelect = useCallback(async (file: File) => {
    // Validate size (10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    setProcessing(true);
    try {
      const { preview, file: downscaled } = await downscaleImage(file);
      setPhoto(downscaled);
      setPhotoPreview(preview);
    } catch {
      // Fallback: use original file if downscaling fails
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    } finally {
      setProcessing(false);
    }
  }, []);

  const removePhoto = useCallback(() => {
    setPhoto(null);
    setPhotoPreview(null);
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, ""]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleSubmit = async () => {
    const validItems = items.filter((t) => t.trim().length > 0);
    if (!photo) return;
    setSubmitting(true);
    try {
      onSubmit(validItems, photo);
      setItems([""]);
      removePhoto();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-tunet-green" />
            {COPY.attendance.todoFormTitle}
          </SheetTitle>
          <SheetDescription>
            {COPY.attendance.todoFormDescription}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-2">
          {/* Photo Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-tunet-text">
                {COPY.attendance.photoTitle}
              </span>
              <span className="text-[10px] text-tunet-ember">*</span>
            </div>

            {photoPreview ? (
              /* Photo preview */
              <div className="relative">
                <img
                  src={photoPreview}
                  alt={COPY.attendance.photoPreview}
                  className="w-full h-48 object-cover rounded-lg border border-tunet-border"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-tunet-bg/80 text-tunet-text-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="mt-2">
                  <PhotoPickerButton onFile={handlePhotoSelect} disabled={processing} />
                </div>
              </div>
            ) : /* Empty state + picker */
            processing ? (
              <div className="w-full h-32 flex flex-col items-center justify-center gap-2 border border-tunet-border rounded-lg bg-tunet-surface">
                <Loader2 className="h-6 w-6 animate-spin text-tunet-green" />
                <span className="text-sm text-tunet-text-muted">{COPY.attendance.photoUploading}</span>
              </div>
            ) : (
              <PhotoPickerButton onFile={handlePhotoSelect} />
            )}

            <p className="mt-2 text-[11px] text-tunet-text-muted">
              {COPY.attendance.photoRequired}
            </p>
          </div>

          {/* Todo List Section */}
          <div className="mt-4 space-y-3 pb-4">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-tunet-green" />
              <span className="text-sm font-medium text-tunet-text">To-Do Hari Ini</span>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-tunet-text-muted text-sm font-medium w-6 text-center">
                  {index + 1}.
                </span>
                <Input
                  value={item}
                  onChange={(e) => updateItem(index, e.target.value)}
                  placeholder={`${COPY.attendance.todoPlaceholder} ${index + 1}`}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (index === items.length - 1) addItem();
                    }
                  }}
                  disabled={submitting}
                />
                {items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-tunet-text-muted hover:text-red-400"
                    onClick={() => removeItem(index)}
                    disabled={submitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-dashed border-tunet-border text-tunet-text-muted hover:text-tunet-green hover:border-tunet-green/40"
              onClick={addItem}
              disabled={submitting}
            >
              <Plus className="h-4 w-4 mr-1" />
              {COPY.attendance.todoAddItem}
            </Button>
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {COPY.actions.cancel}
          </Button>
          <Button
            className="bg-tunet-green hover:bg-tunet-green/90 text-tunet-bg"
            onClick={handleSubmit}
            disabled={submitting || !photo}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {COPY.attendance.photoUploading}
              </>
            ) : (
              COPY.attendance.todoSubmit
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
