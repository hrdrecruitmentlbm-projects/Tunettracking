"use client";

import { ListTodo, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import type { AttendanceTodo } from "@/types";

interface TodoListProps {
  todos: AttendanceTodo[];
  onAddClick?: () => void;
}

export function TodoList({ todos, onAddClick }: TodoListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-tunet-text-muted">
          <ListTodo className="h-4 w-4" />
          {COPY.attendance.todoListTitle}
        </div>
        {onAddClick && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-tunet-green hover:text-tunet-green/80 hover:bg-tunet-green/10"
            onClick={onAddClick}
          >
            <Plus className="h-3 w-3 mr-0.5" />
            {COPY.attendance.todoAddButton}
          </Button>
        )}
      </div>
      {todos.length === 0 ? (
        <p className="text-sm text-tunet-text-muted italic">
          {COPY.attendance.todoEmpty}
        </p>
      ) : (
        <ul className="space-y-1">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-start gap-2 text-sm text-tunet-text"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-tunet-green" />
              {todo.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
