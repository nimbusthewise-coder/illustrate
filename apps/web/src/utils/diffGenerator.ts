/**
 * Diff Generator Utility
 * F027: Iterative Refinement via Follow-up Prompts
 * 
 * Calculates differences between flow specifications and generates change descriptions.
 */

import type { FlowChange } from '@/types/conversation';
import type { FlowSpecification, ComponentSpec, ConnectionSpec } from '@/types/prompt';

/**
 * Calculate differences between two flow specifications
 */
export function calculateFlowDiff(
  before: FlowSpecification,
  after: FlowSpecification
): FlowChange[] {
  const changes: FlowChange[] = [];
  
  // Compare components
  changes.push(...compareComponents(before.components, after.components));
  
  // Compare connections
  changes.push(...compareConnections(before.connections, after.connections));
  
  // Compare layout
  changes.push(...compareLayout(before.layout, after.layout));
  
  return changes;
}

/**
 * Compare component lists
 */
function compareComponents(
  before: ComponentSpec[],
  after: ComponentSpec[]
): FlowChange[] {
  const changes: FlowChange[] = [];
  const beforeMap = new Map(before.map(c => [c.id, c]));
  const afterMap = new Map(after.map(c => [c.id, c]));
  
  // Find added components
  for (const comp of after) {
    if (!beforeMap.has(comp.id)) {
      changes.push({
        id: `change_comp_add_${comp.id}`,
        type: 'add',
        target: 'component',
        targetId: comp.id,
        after: comp,
        description: `Added component "${comp.name}"`,
      });
    }
  }
  
  // Find removed components
  for (const comp of before) {
    if (!afterMap.has(comp.id)) {
      changes.push({
        id: `change_comp_remove_${comp.id}`,
        type: 'remove',
        target: 'component',
        targetId: comp.id,
        before: comp,
        description: `Removed component "${comp.name}"`,
      });
    }
  }
  
  // Find modified components
  for (const comp of after) {
    const beforeComp = beforeMap.get(comp.id);
    if (beforeComp && !isComponentEqual(beforeComp, comp)) {
      changes.push({
        id: `change_comp_modify_${comp.id}`,
        type: 'modify',
        target: 'component',
        targetId: comp.id,
        before: beforeComp,
        after: comp,
        description: describeComponentChange(beforeComp, comp),
      });
    }
  }
  
  return changes;
}

/**
 * Compare connection lists
 */
function compareConnections(
  before: ConnectionSpec[],
  after: ConnectionSpec[]
): FlowChange[] {
  const changes: FlowChange[] = [];
  const beforeMap = new Map(before.map(c => [c.id, c]));
  const afterMap = new Map(after.map(c => [c.id, c]));
  
  // Find added connections
  for (const conn of after) {
    if (!beforeMap.has(conn.id)) {
      changes.push({
        id: `change_conn_add_${conn.id}`,
        type: 'add',
        target: 'connection',
        targetId: conn.id,
        after: conn,
        description: `Added connection from "${conn.from}" to "${conn.to}"`,
      });
    }
  }
  
  // Find removed connections
  for (const conn of before) {
    if (!afterMap.has(conn.id)) {
      changes.push({
        id: `change_conn_remove_${conn.id}`,
        type: 'remove',
        target: 'connection',
        targetId: conn.id,
        before: conn,
        description: `Removed connection from "${conn.from}" to "${conn.to}"`,
      });
    }
  }
  
  // Find modified connections
  for (const conn of after) {
    const beforeConn = beforeMap.get(conn.id);
    if (beforeConn && !isConnectionEqual(beforeConn, conn)) {
      changes.push({
        id: `change_conn_modify_${conn.id}`,
        type: 'modify',
        target: 'connection',
        targetId: conn.id,
        before: beforeConn,
        after: conn,
        description: describeConnectionChange(beforeConn, conn),
      });
    }
  }
  
  return changes;
}

/**
 * Compare layout configurations
 */
function compareLayout(
  before: FlowSpecification['layout'],
  after: FlowSpecification['layout']
): FlowChange[] {
  const changes: FlowChange[] = [];
  
  if (!isLayoutEqual(before, after)) {
    changes.push({
      id: `change_layout_${Date.now()}`,
      type: 'modify',
      target: 'layout',
      before,
      after,
      description: describeLayoutChange(before, after),
    });
  }
  
  return changes;
}

/**
 * Check if two components are equal
 */
function isComponentEqual(a: ComponentSpec, b: ComponentSpec): boolean {
  return (
    a.id === b.id &&
    a.type === b.type &&
    a.name === b.name &&
    a.content === b.content &&
    a.role === b.role &&
    JSON.stringify(a.style) === JSON.stringify(b.style) &&
    JSON.stringify(a.slots) === JSON.stringify(b.slots)
  );
}

/**
 * Check if two connections are equal
 */
function isConnectionEqual(a: ConnectionSpec, b: ConnectionSpec): boolean {
  return (
    a.id === b.id &&
    a.from === b.from &&
    a.to === b.to &&
    a.type === b.type &&
    a.label === b.label &&
    JSON.stringify(a.style) === JSON.stringify(b.style)
  );
}

/**
 * Check if two layouts are equal
 */
function isLayoutEqual(
  a: FlowSpecification['layout'],
  b: FlowSpecification['layout']
): boolean {
  return (
    a.direction === b.direction &&
    a.spacing === b.spacing &&
    a.alignment === b.alignment &&
    a.wrap === b.wrap
  );
}

/**
 * Describe what changed in a component
 */
function describeComponentChange(
  before: ComponentSpec,
  after: ComponentSpec
): string {
  const parts: string[] = [];
  
  if (before.name !== after.name) {
    parts.push(`renamed to "${after.name}"`);
  }
  
  if (before.content !== after.content) {
    parts.push(`content changed`);
  }
  
  if (before.type !== after.type) {
    parts.push(`type changed to ${after.type}`);
  }
  
  if (JSON.stringify(before.style) !== JSON.stringify(after.style)) {
    parts.push(`style updated`);
  }
  
  if (parts.length === 0) {
    return `Modified component "${after.name}"`;
  }
  
  return `Component "${before.name}" ${parts.join(', ')}`;
}

/**
 * Describe what changed in a connection
 */
function describeConnectionChange(
  before: ConnectionSpec,
  after: ConnectionSpec
): string {
  const parts: string[] = [];
  
  if (before.from !== after.from || before.to !== after.to) {
    parts.push(`endpoints changed`);
  }
  
  if (before.label !== after.label) {
    parts.push(`label ${after.label ? `set to "${after.label}"` : 'removed'}`);
  }
  
  if (before.type !== after.type) {
    parts.push(`type changed to ${after.type}`);
  }
  
  if (JSON.stringify(before.style) !== JSON.stringify(after.style)) {
    parts.push(`style updated`);
  }
  
  if (parts.length === 0) {
    return `Modified connection`;
  }
  
  return `Connection ${parts.join(', ')}`;
}

/**
 * Describe what changed in layout
 */
function describeLayoutChange(
  before: FlowSpecification['layout'],
  after: FlowSpecification['layout']
): string {
  const parts: string[] = [];
  
  if (before.direction !== after.direction) {
    parts.push(`direction: ${before.direction} → ${after.direction}`);
  }
  
  if (before.spacing !== after.spacing) {
    parts.push(`spacing: ${before.spacing} → ${after.spacing}`);
  }
  
  if (before.alignment !== after.alignment) {
    parts.push(`alignment: ${before.alignment || 'default'} → ${after.alignment || 'default'}`);
  }
  
  if (before.wrap !== after.wrap) {
    parts.push(`wrap: ${before.wrap ? 'on' : 'off'} → ${after.wrap ? 'on' : 'off'}`);
  }
  
  return `Layout updated (${parts.join(', ')})`;
}

/**
 * Apply changes to a flow specification
 */
export function applyChanges(
  flow: FlowSpecification,
  changes: FlowChange[]
): FlowSpecification {
  let result = { ...flow };
  
  for (const change of changes) {
    result = applyChange(result, change);
  }
  
  return result;
}

/**
 * Apply a single change
 */
function applyChange(
  flow: FlowSpecification,
  change: FlowChange
): FlowSpecification {
  const result = { ...flow };
  
  switch (change.target) {
    case 'component':
      result.components = applyComponentChange(result.components, change);
      break;
      
    case 'connection':
      result.connections = applyConnectionChange(result.connections, change);
      break;
      
    case 'layout':
      if (change.after) {
        result.layout = change.after as FlowSpecification['layout'];
      }
      break;
  }
  
  return result;
}

/**
 * Apply component change
 */
function applyComponentChange(
  components: ComponentSpec[],
  change: FlowChange
): ComponentSpec[] {
  const result = [...components];
  
  switch (change.type) {
    case 'add':
      if (change.after) {
        result.push(change.after as ComponentSpec);
      }
      break;
      
    case 'remove':
      return result.filter(c => c.id !== change.targetId);
      
    case 'modify':
      return result.map(c =>
        c.id === change.targetId && change.after
          ? (change.after as ComponentSpec)
          : c
      );
  }
  
  return result;
}

/**
 * Apply connection change
 */
function applyConnectionChange(
  connections: ConnectionSpec[],
  change: FlowChange
): ConnectionSpec[] {
  const result = [...connections];
  
  switch (change.type) {
    case 'add':
      if (change.after) {
        result.push(change.after as ConnectionSpec);
      }
      break;
      
    case 'remove':
      return result.filter(c => c.id !== change.targetId);
      
    case 'modify':
      return result.map(c =>
        c.id === change.targetId && change.after
          ? (change.after as ConnectionSpec)
          : c
      );
  }
  
  return result;
}

/**
 * Generate a human-readable summary of changes
 */
export function summarizeChanges(changes: FlowChange[]): string {
  if (changes.length === 0) {
    return 'No changes';
  }
  
  const groups = {
    added: changes.filter(c => c.type === 'add'),
    removed: changes.filter(c => c.type === 'remove'),
    modified: changes.filter(c => c.type === 'modify'),
  };
  
  const parts: string[] = [];
  
  if (groups.added.length > 0) {
    parts.push(`${groups.added.length} added`);
  }
  
  if (groups.removed.length > 0) {
    parts.push(`${groups.removed.length} removed`);
  }
  
  if (groups.modified.length > 0) {
    parts.push(`${groups.modified.length} modified`);
  }
  
  return parts.join(', ');
}
