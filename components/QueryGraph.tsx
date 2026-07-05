"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { layoutGraph } from "@/lib/layoutGraph";

interface QueryGraphProps {
  nodes: Node[];
  edges: Edge[];
}

export default function QueryGraph({ nodes, edges }: QueryGraphProps) {
  const { nodes: positionedNodes, edges: positionedEdges } = useMemo(
    () => layoutGraph(nodes, edges),
    [nodes, edges]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={positionedNodes}
        edges={positionedEdges}
        fitView
        colorMode="dark"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}