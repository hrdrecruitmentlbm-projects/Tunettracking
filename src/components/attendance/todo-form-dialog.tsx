"use client";

import { useState, useRef, useCallback } from "react";
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
import { X, Plus, ListTodo, Camera, ImageIcon, Loader2 } from "lucide-react";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

interface TodoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (todos: string[], photo: File | null) => void;
}

export function TodoFormDialog({ open, onOpenChange, onSubmit }: TodoFormDialogProps) {
  const [items, setItems] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > 5 * 1024 * 1024) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }

    setPhoto(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }, []);

  const removePhoto = useCallback(() => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [photoPreview]);

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
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-tunet-green" />
            {COPY.attendance.todoFormTitle}
          </SheetTitle>
          <SheetDescription>
            {COPY.attendance.todoFormDescription}
          </SheetDescription>
        </SheetHeader>

        {/* Photo Capture Section */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-4 w-4 text-tunet-green" />
            <span className="text-sm font-medium text-tunet-text">
              {COPY.attendance.photoTitle}
            </span>
            <span className="text-[10px] text-tunet-ember">*</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            capture="user"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          {photoPreview ? (
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
                <X className="h-4 w-4" />
              </button>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="border-tunet-border text-tunet-text-muted hover:text-tunet-green hover:border-tunet-green/40"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  {COPY.attendance.photoRetake}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              className={cn(
                "w-full h-32 flex flex-col items-center justify-center gap-2",
                "border-2 border-dashed border-tunet-border rounded-lg",
                "text-tunet-text-muted hover:text-tunet-green hover:border-tunet-green/40",
                "transition-colors"
              )}
            >
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm">{COPY.attendance.photoCapture}</span>
              <span className="text-[10px] text-tunet-text-muted">
                {COPY.attendance.photoRequired}
              </span>
            </button>
          )}
        </div>

        {/* Todo List Section */}
        <div className="mt-6 space-y-3">
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

        <SheetFooter className="mt-6">
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
