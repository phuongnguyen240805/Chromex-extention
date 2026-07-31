import React from "react";
import { useDroppable } from "@dnd-kit/core";

export function AppContentDroppable(props: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: "droppable",
  });

  return <div ref={setNodeRef}>{props.children}</div>;
}
