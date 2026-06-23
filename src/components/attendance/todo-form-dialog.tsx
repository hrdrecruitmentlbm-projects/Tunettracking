"use client";

import { useState } from "react";
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
import { X, Plus, ListTodo } from "lucide-react";
import { COPY } from "@/lib/copy";

interface TodoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (todos: string[]) => void;
}

export function TodoFormDialog({ open, onOpenChange, onSubmit }: TodoFormDialogProps) {
  const [items, setItems] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);

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
    if (validItems.length === 0) return;
    setSubmitting(true);
    try {
      onSubmit(validItems);
      setItems([""]);
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

        <div className="mt-6 space-y-3">
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
            disabled={submitting || items.every((t) => t.trim().length === 0)}
          >
            {COPY.attendance.todoSubmit}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
