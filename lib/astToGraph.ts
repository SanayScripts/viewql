import type { Node, Edge } from "@xyflow/react";

interface TableNodeData {
  label: string;
  alias: string | null;
  filters: string[];
  [key: string]: unknown;
}

interface JoinInfo {
  type: string;
  condition: string;
}

function exprToString(expr: any): string {
  if (!expr) return "";

  if (expr.type === "column_ref") {
    const table = expr.table ? `${expr.table}.` : "";
    const column =
      typeof expr.column === "string" ? expr.column : expr.column?.expr?.value ?? "";
    return `${table}${column}`;
  }

  if (expr.type === "binary_expr") {
    return `${exprToString(expr.left)} ${expr.operator} ${exprToString(expr.right)}`;
  }

  if (expr.type === "number" || expr.type === "single_quote_string") {
    return String(expr.value);
  }

  return expr.value !== undefined ? String(expr.value) : "";
}

export function astToGraph(ast: any): { nodes: Node<TableNodeData>[]; edges: Edge[] } {
  const nodes: Node<TableNodeData>[] = [];
  const edges: Edge[] = [];

  const fromClauses = Array.isArray(ast.from) ? ast.from : [];

  fromClauses.forEach((fromItem: any, index: number) => {
    const tableName = fromItem.table;
    const alias = fromItem.as ?? null;
    const nodeId = alias ?? tableName;

    nodes.push({
      id: nodeId,
      type: "tableNode",
      position: { x: 0, y: 0 },
      data: {
        label: tableName,
        alias,
        filters: [],
      },
    });

    if (fromItem.join) {
      const joinInfo: JoinInfo = {
        type: fromItem.join,
        condition: exprToString(fromItem.on),
      };

      const previousItem = fromClauses[index - 1];
      const sourceId = previousItem?.as ?? previousItem?.table;

      if (sourceId) {
        edges.push({
          id: `${sourceId}-${nodeId}`,
          source: sourceId,
          target: nodeId,
          label: `${joinInfo.type}`,
          data: { condition: joinInfo.condition },
          type: "joinEdge",
        });
      }
    }
  });

  if (ast.where) {
    const filterText = exprToString(ast.where);
    const firstNode = nodes[0];
    if (firstNode) {
      firstNode.data.filters.push(filterText);
    }
  }

  return { nodes, edges };
}