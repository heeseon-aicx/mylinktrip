"use client";

import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { LinkItem } from "@/data/types";
import { PlaceCard } from "./PlaceCard";

interface PlaceListDnDProps {
  items: LinkItem[];
  videoId: string | null;
  onUpdateMemo: (itemId: number) => (memo: string | null) => void;
  onDelete: (itemId: number) => () => void;
  onReorder: (orderedItems: { id: number; order_index: number }[]) => void;
}

const SortableWrapper = styled.div<{ isDragging: boolean }>`
  position: relative;
  opacity: ${(props) => (props.isDragging ? 0.5 : 1)};
  z-index: ${(props) => (props.isDragging ? 1000 : 1)};

  &:hover .drag-handle {
    opacity: 1;
  }
`;

const DragHandle = styled.div`
  position: absolute;
  left: 0;
  top: 20px;
  z-index: 10;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.2s ease;

  &:active {
    cursor: grabbing;
  }
`;

const DragHandleInner = styled.div`
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 16px;
    height: 16px;
    color: var(--color-gray-400);
  }
`;

export function PlaceListDnD({
  items,
  videoId,
  onUpdateMemo,
  onDelete,
  onReorder,
}: PlaceListDnDProps) {
  const [localItems, setLocalItems] = useState(items);

  // items prop이 변경되면 localItems 업데이트
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localItems.findIndex((item) => item.id === active.id);
    const newIndex = localItems.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newItems = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(newItems);

    const orderedItems = newItems.map((item, idx) => ({
      id: item.id,
      order_index: idx,
    }));

    onReorder(orderedItems);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div>
          {localItems.map((item, index) => (
            <SortablePlaceCard
              key={item.id}
              item={item}
              videoId={videoId}
              isLast={index === localItems.length - 1}
              onUpdateMemo={onUpdateMemo(item.id)}
              onDelete={onDelete(item.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ============================================
// Sortable Place Card Wrapper
// ============================================

interface SortablePlaceCardProps {
  item: LinkItem;
  videoId: string | null;
  isLast: boolean;
  onUpdateMemo: (memo: string | null) => void;
  onDelete: () => void;
}

function SortablePlaceCard({ item, videoId, isLast, onUpdateMemo, onDelete }: SortablePlaceCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <SortableWrapper ref={setNodeRef} style={style} isDragging={isDragging} {...attributes}>
      {/* 드래그 핸들 - 타임라인 아이콘 위에 오버레이 */}
      <DragHandle className="drag-handle" {...listeners}>
        <DragHandleInner>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
          </svg>
        </DragHandleInner>
      </DragHandle>

      <PlaceCard item={item} videoId={videoId} isLast={isLast} onUpdateMemo={onUpdateMemo} onDelete={onDelete} />
    </SortableWrapper>
  );
}
