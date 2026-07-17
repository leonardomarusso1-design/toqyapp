"use client";

// Reorder por drag real (mouse E toque), 2026-07-16 — antes disso, os 3
// lugares que reordenam por índice (botões em ButtonEditor.tsx, itens de
// catálogo e categorias em SiteBuilder.tsx) só tinham setas ↑↓, sem drag de
// verdade. PointerSensor cobre mouse, TouchSensor cobre toque com um delay
// (150ms) pra não brigar com o scroll da página no celular — arrastar sem
// esse delay faria qualquer scroll vertical iniciar um drag por engano.
import type { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export { arrayMove };

export type DragHandleProps = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
};

// Handle de arrastar reutilizável — mantido como botão separado das setas
// ↑↓ existentes (não substitui, complementa: quem não consegue arrastar
// continua tendo as setas como alternativa acessível).
export function DragHandle({ attributes, listeners, className = "" }: DragHandleProps & { className?: string }) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className={`cursor-grab touch-none rounded-lg border border-border p-1.5 text-muted hover:text-ink active:cursor-grabbing ${className}`}
      aria-label="Arrastar para reordenar"
    >
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  );
}

function SortableRow({ id, children }: { id: string; children: (drag: DragHandleProps, isDragging: boolean) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners }, isDragging)}
    </div>
  );
}

// Componente genérico: cada chamador mantém o JSX do próprio item (header,
// campos, etc.) e só troca a renderização das setas por um DragHandle
// posicionado onde fizer sentido — reordenar em si (arrayMove + onReorder)
// fica centralizado aqui, uma vez só, em vez de reimplementado 3x.
export function DragReorderList<T>({
  items,
  itemKey,
  onReorder,
  children,
}: {
  items: T[];
  itemKey: (item: T) => string;
  onReorder: (next: T[]) => void;
  children: (item: T, index: number, drag: DragHandleProps) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => itemKey(item) === active.id);
    const newIndex = items.findIndex((item) => itemKey(item) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(itemKey)} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => (
          <SortableRow key={itemKey(item)} id={itemKey(item)}>
            {(drag) => children(item, index, drag)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}
