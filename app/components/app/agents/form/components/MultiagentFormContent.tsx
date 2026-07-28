import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Bot, UserCircle2, Plus, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { useTheme } from "~/hooks/useTheme";

export interface SubAgentOption {
  id: string;
  name: string;
}

export interface MultiagentFormState {
  subAgentIds: string[];
}

const MAIN_NODE_ID = "main-agent";

function MainAgentNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-6 py-4 rounded-xl border-2 border-border bg-muted shadow-lg min-w-[180px]">
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-foreground/80 !border-2 !border-foreground"
      />
      <div className="flex flex-col items-center gap-2">
        <span className="flex h-14 w-14 rounded-full bg-muted-foreground/20 items-center justify-center">
          <Bot className="h-8 w-8 text-foreground" />
        </span>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Principal
          </p>
          <p className="text-foreground font-semibold truncate max-w-[160px]">
            {data.label || "Nuevo agente"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SubAgentNode({ data, id }: { data: { label: string }; id: string }) {
  const onRemove = (data as { onRemove?: (id: string) => void }).onRemove;
  return (
    <div className="px-4 py-3 rounded-xl border-2 border-border bg-muted/50 hover:bg-muted min-w-[150px] group">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-foreground/60 !border-2 !border-foreground"
      />
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 rounded-full bg-muted items-center justify-center">
          <UserCircle2 className="h-5 w-5 text-foreground" />
        </span>
        <p className="text-foreground font-medium truncate flex-1">{data.label}</p>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/30 text-muted-foreground hover:text-red-500 transition-opacity cursor-pointer"
            aria-label="Quitar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  mainAgent: MainAgentNode,
  subAgent: SubAgentNode as React.ComponentType<any>,
};

interface MultiagentFormContentProps {
  agentName: string;
  availableAgents: SubAgentOption[];
  value: MultiagentFormState;
  onChange: (v: MultiagentFormState) => void;
  onSave?: () => void;
  isSubmitting?: boolean;
}

export function MultiagentFormContent({
  agentName,
  availableAgents = [],
  value,
  onChange,
  onSave,
  isSubmitting = false,
}: MultiagentFormContentProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  React.useEffect(() => {
    if (!showAddMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target as Node)
      ) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddMenu]);

  const subAgentsThatCanBeAdded = useMemo(
    () => availableAgents.filter((a) => !value.subAgentIds.includes(a.id)),
    [availableAgents, value.subAgentIds],
  );

  const removeSubAgent = useCallback(
    (nodeId: string) => {
      const agentId = nodeId.replace("sub-", "");
      onChange({
        subAgentIds: value.subAgentIds.filter((id) => id !== agentId),
      });
    },
    [value.subAgentIds, onChange],
  );

  const initialNodes: Node[] = useMemo(
    () => [
      {
        id: MAIN_NODE_ID,
        type: "mainAgent",
        position: { x: 200, y: 80 },
        data: { label: agentName },
        sourcePosition: Position.Bottom,
      },
      ...value.subAgentIds.map((agentId, i) => {
        const agent = availableAgents.find((a) => a.id === agentId);
        return {
          id: `sub-${agentId}`,
          type: "subAgent",
          position: { x: 80 + (i % 3) * 180, y: 280 + Math.floor(i / 3) * 100 },
          data: {
            label: agent?.name ?? "Agente",
            onRemove: removeSubAgent,
          },
          targetPosition: Position.Top,
        };
      }),
    ],
    [agentName, value.subAgentIds, availableAgents, removeSubAgent],
  );

  const edgeStroke = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.25)";
  const initialEdges: Edge[] = useMemo(
    () =>
      value.subAgentIds.map((agentId) => ({
        id: `e-${MAIN_NODE_ID}-sub-${agentId}`,
        source: MAIN_NODE_ID,
        target: `sub-${agentId}`,
        type: "smoothstep",
        animated: true,
        style: { stroke: edgeStroke, strokeWidth: 2 },
      })),
    [value.subAgentIds, edgeStroke],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes((currentNodes) => {
      const newNodes: Node[] = [
        {
          id: MAIN_NODE_ID,
          type: "mainAgent",
          position: currentNodes.find((n) => n.id === MAIN_NODE_ID)
            ?.position ?? { x: 200, y: 80 },
          data: { label: agentName },
          sourcePosition: Position.Bottom,
        },
        ...value.subAgentIds.map((agentId, i) => {
          const agent = availableAgents.find((a) => a.id === agentId);
          const existing = currentNodes.find((n) => n.id === `sub-${agentId}`);
          return {
            id: `sub-${agentId}`,
            type: "subAgent",
            position: existing?.position ?? {
              x: 80 + (i % 3) * 180,
              y: 280 + Math.floor(i / 3) * 100,
            },
            data: {
              label: agent?.name ?? "Agente",
              onRemove: removeSubAgent,
            },
            targetPosition: Position.Top,
          };
        }),
      ];
      return newNodes;
    });
    setEdges(
      value.subAgentIds.map((agentId) => ({
        id: `e-${MAIN_NODE_ID}-sub-${agentId}`,
        source: MAIN_NODE_ID,
        target: `sub-${agentId}`,
        type: "smoothstep",
        animated: true,
        style: { stroke: edgeStroke, strokeWidth: 2 },
      })),
    );
  }, [
    value.subAgentIds,
    agentName,
    availableAgents,
    removeSubAgent,
    setNodes,
    setEdges,
    edgeStroke,
  ]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  const handleAddSubAgent = (agentId: string) => {
    if (!agentId || value.subAgentIds.includes(agentId)) return;
    onChange({
      subAgentIds: [...value.subAgentIds, agentId],
    });
    setShowAddMenu(false);
  };

  const isValid = value.subAgentIds.length >= 2;

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-muted/30 dark:bg-black/40 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-transparent"
          style={{ background: "transparent" }}
        >
          <Background
            color={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}
            gap={16}
            size={1}
          />
          <Controls className="!bg-muted !border-border !rounded-lg [&>button]:!bg-muted [&>button]:!text-foreground [&>button:hover]:!bg-muted-foreground/20" />
        </ReactFlow>
      </div>

      {/* Floating add button */}
      <div
        ref={addMenuRef}
        className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-2"
      >
        {showAddMenu && (
          <div
            className="rounded-xl border border-border bg-card backdrop-blur-sm shadow-xl overflow-hidden min-w-[200px] max-h-[280px] overflow-y-auto"
            role="menu"
          >
            {subAgentsThatCanBeAdded.length === 0 ? (
              <div className="py-4 px-4 text-center text-sm text-muted-foreground">
                {availableAgents.length === 0 ? (
                  <>
                    <p>No hay agentes disponibles.</p>
                    <p className="text-xs mt-1">
                      Crea primero agentes específicos para usarlos como
                      subagentes.
                    </p>
                  </>
                ) : (
                  <p>Todos los agentes ya están agregados</p>
                )}
              </div>
            ) : (
              subAgentsThatCanBeAdded.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleAddSubAgent(a.id)}
                  className="w-full px-4 py-2.5 text-left text-foreground hover:bg-muted focus:bg-muted focus:outline-none transition-colors"
                >
                  {a.name}
                </button>
              ))
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowAddMenu((v) => !v)}
          disabled={
            subAgentsThatCanBeAdded.length === 0 && availableAgents.length > 0
          }
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring",
            subAgentsThatCanBeAdded.length === 0 &&
              availableAgents.length > 0 &&
              "opacity-50 cursor-not-allowed",
          )}
          aria-label="Agregar subagente"
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>

      {!isValid && value.subAgentIds.length > 0 && (
        <p className="absolute bottom-6 left-6 text-sm text-amber-400 z-10">
          Agrega al menos 2 subagentes para poder guardar.
        </p>
      )}
    </div>
  );
}
