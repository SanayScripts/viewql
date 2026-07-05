"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { EditorView, basicSetup } from "codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { Parser } from "node-sql-parser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { astToGraph } from "@/lib/astToGraph";
import QueryGraph from "@/components/QueryGraph";

const DEFAULT_QUERY = `SELECT orders.id, customers.name
FROM orders
LEFT JOIN customers ON orders.customer_id = customers.id
WHERE orders.total > 100`;

const editorTheme = EditorView.theme(
  {
    "&": { color: "#e4e4e7", backgroundColor: "#09090b", height: "100%" },
    ".cm-content": { caretColor: "#e4e4e7" },
    ".cm-line": { color: "#e4e4e7" },
    ".cm-gutters": { backgroundColor: "#09090b", color: "#71717a", border: "none" },
  },
  { dark: true }
);

export default function SqlEditor() {
  const [sqlText, setSqlText] = useState(DEFAULT_QUERY);
  const [astOutput, setAstOutput] = useState<string>("");
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({
    nodes: [],
    edges: [],
  });
  const [error, setError] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const parser = useMemo(() => new Parser(), []);

  const parseQuery = useCallback(
    (text: string) => {
      try {
        const ast = parser.astify(text, { database: "PostgreSQL" });
        setAstOutput(JSON.stringify(ast, null, 2));
        const singleAst = Array.isArray(ast) ? ast[0] : ast;
        setGraphData(astToGraph(singleAst));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse SQL");
        setAstOutput("");
      }
    },
    [parser]
  );

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const view = new EditorView({
      doc: sqlText,
      extensions: [
        basicSetup,
        sql({ dialect: PostgreSQL }),
        editorTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newText = update.state.doc.toString();
            setSqlText(newText);
            parseQuery(newText);
          }
        }),
      ],
      parent: editorRef.current,
    });

    viewRef.current = view;
    parseQuery(sqlText);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4 h-screen p-4 bg-zinc-950 overflow-hidden">
      <div className="flex flex-col gap-2 min-h-0">
        <h2 className="text-zinc-400 text-sm font-mono uppercase tracking-wide">
          SQL Input
        </h2>
        <div
          ref={editorRef}
          className="flex-1 border border-zinc-800 rounded-lg overflow-auto text-sm min-h-0"
        />
      </div>

      <div className="flex flex-col gap-2 min-h-0">
        <h2 className="text-zinc-400 text-sm font-mono uppercase tracking-wide">
          Parsed AST
        </h2>
        <div className="flex-1 border border-zinc-800 rounded-lg overflow-auto p-3 bg-zinc-900 min-h-0">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Parse Error</AlertTitle>
              <AlertDescription className="font-mono text-xs">
                {error}
              </AlertDescription>
            </Alert>
          ) : (
            <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap">
              {astOutput}
            </pre>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 min-h-0">
        <h2 className="text-zinc-400 text-sm font-mono uppercase tracking-wide">
          Query Graph
        </h2>
        <div className="flex-1 border border-zinc-800 rounded-lg overflow-hidden min-h-0">
          <QueryGraph nodes={graphData.nodes} edges={graphData.edges} />
        </div>
      </div>
    </div>
  );
}