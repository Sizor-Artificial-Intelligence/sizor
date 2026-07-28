# Diseño: Agente principal y subagentes (multiagente)

## Objetivo

Poder tener un **agente principal** que el usuario asigna a un contacto o plan, y que ese agente pueda ser:

1. **Agente simple** (comportamiento actual): un solo conjunto de instrucciones, reglas y herramientas. No hay subagentes.
2. **Agente multiagente**: un orquestador que tiene varios **subagentes** (ej. Soporte, Ventas). Según lo que escriba el usuario, se elige el subagente adecuado y responde ese (soporte vs ventas).

En ambos casos, **Contact** y **Plan** siguen asignados a un solo agente: el agente principal. No es obligatorio usar multiagente.

---

## Conceptos

| Concepto | Descripción |
|----------|-------------|
| **Agente principal** | El agente que se asigna a un Contact o a un Plan. Es el que “atiende” al usuario. Puede ser simple o multiagente. |
| **Agente simple** | Un agente principal sin subagentes. Responde con sus propias instrucciones y herramientas (comportamiento actual). |
| **Subagente** | Un agente existente que se usa “dentro” de un agente principal multiagente, con un rol (ej. soporte, ventas). |
| **Multiagente** | Agente principal que tiene uno o más subagentes; la respuesta se genera usando el subagente que corresponda al mensaje del usuario. |

---

## Modelo de datos (resumen)

- **Agent** (sin cambios de significado): sigue siendo la entidad que se crea en “Crear agente”. Puede usarse como:
  - Agente principal solo (asignado a Contact/Plan).
  - Agente principal multiagente (orquestador).
  - Subagente de otro agente (reutilizable en varios principales).

- **Nuevo campo en Agent**
  - `isMultiAgent Boolean @default(false)`: si es `true`, este agente es orquestador y se usan sus subagentes para responder; si es `false` (o no tiene subagentes), se comporta como agente simple.

- **Nueva tabla AgentSubAgent** (relación N:N entre agente principal y subagentes)
  - `mainAgentId`: agente principal (el que tiene `isMultiAgent = true`).
  - `subAgentId`: agente que actúa como subagente (cualquier Agent de la misma company).
  - `role`: etiqueta para enrutar (ej. `"soporte"`, `"ventas"`, `"general"`). El backend usará esto para decidir qué subagente usa.
  - `order`: orden de preferencia o visualización.

Así, lo que hoy es “crear agente” sigue siendo crear un **Agent**. La diferencia es que luego puedes:
- Usar ese agente como agente principal solo (asignarlo a Contact/Plan y listo), o
- Marcar un agente como multiagente y asignarle otros agentes como subagentes con roles.

---

## Flujo de uso

### Agente simple (actual)

1. Creas un agente (nombre, instrucciones, reglas, etc.).
2. Lo asignas a un Contact o al Plan.
3. Cuando el usuario escribe, sizor-ai usa ese agente (instrucciones, limitaciones, herramientas). Sin cambios.

### Agente multiagente

1. Creas varios agentes (ej. “Soporte”, “Ventas”), cada uno con sus instrucciones y capacidades.
2. Creas un agente “principal” (ej. “Atención al cliente”) y marcas **Multiagente**.
3. En la configuración del agente principal, asignas subagentes:
   - Subagente: “Soporte”, rol: `soporte`
   - Subagente: “Ventas”, rol: `ventas`
4. Asignas ese agente principal al Contact o Plan.
5. Cuando el usuario escribe:
   - El backend (sizor-ai) clasifica la intención (soporte vs ventas u otros).
   - Elige el subagente por `role`.
   - Genera la respuesta con las instrucciones y herramientas de ese subagente.

Si no quieres multiagente, simplemente no marcas el agente como multiagente y no añades subagentes; equivale al comportamiento actual.

---

## Lógica en backend (sizor-ai)

- **Resolver agente**: como ahora, `agentId = contact.agentId ?? plan.agentId` (agente principal).
- **Si el agente principal tiene `isMultiAgent = false` o no tiene subagentes**  
  → Usar ese agente como hasta ahora (instrucciones, reglas, tools de ese agente).
- **Si tiene `isMultiAgent = true` y tiene subagentes**:
  1. Clasificar el último mensaje del usuario (intención/rol: soporte, ventas, etc.).
  2. Elegir el subagente cuyo `role` coincida (o el más adecuado).
  3. Cargar instrucciones, limitaciones, escalación y herramientas del **subagente** elegido.
  4. Generar la respuesta con ese subagente.

La clasificación puede ser con un LLM (“¿es consulta de soporte o de ventas?”) o con keywords por rol; el `role` en `AgentSubAgent` es el que se usa para elegir el subagente.

---

## UI (ideas para más adelante)

- En **Crear/Editar agente**:
  - Checkbox “Es multiagente”. Si está marcado, se muestra una sección “Subagentes”:
    - Lista de agentes de la company (excluyendo el actual y los que ya son multiagente si no quieres anidar).
    - Por cada uno: selector de agente + campo “Rol” (ej. texto o select: soporte, ventas, general).
    - Orden opcional.
- En **Listado de agentes**: indicador visual de “Multiagente” (ej. badge) para los que tienen `isMultiAgent = true` y subagentes.
- Contact/Plan siguen eligiendo un solo agente (el principal); no cambia el flujo de asignación.

---

## Resumen

- Un solo tipo de entidad: **Agent**. Lo que hoy creas son agentes; pueden ser principales (solos o multiagente) o subagentes de otro.
- **isMultiAgent** en Agent: distingue agente simple vs orquestador.
- **AgentSubAgent**: vincula agente principal con subagentes y roles para enrutar.
- No es obligatorio usar multiagente: si no marcas el flag y no añades subagentes, todo se comporta como hasta ahora.

Cuando quieras, el siguiente paso es implementar el esquema Prisma (`isMultiAgent` + tabla `AgentSubAgent`) y luego la UI y la lógica de enrutado en sizor-ai.
