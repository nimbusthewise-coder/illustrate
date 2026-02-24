/**
 * ComponentInstancePanel — F021: Place Components on Canvas
 *
 * Displays a list of placed component instances with:
 * - Visual hierarchy by layer
 * - Instance name (from component definition)
 * - Click to select
 * - Delete button
 * - Position information
 */

'use client';

import { useComponentInstanceStore } from '@/stores/component-instance-store';
import { useComponents } from '@/hooks/useComponents';
import { useLayerStore } from '@/stores/layer-store';

export function ComponentInstancePanel() {
  const instances = useComponentInstanceStore((s) => s.instances);
  const selectedInstanceId = useComponentInstanceStore((s) => s.selectedInstanceId);
  const selectInstance = useComponentInstanceStore((s) => s.selectInstance);
  const removeInstance = useComponentInstanceStore((s) => s.removeInstance);
  const { getComponent } = useComponents();
  const { layers } = useLayerStore();

  // Group instances by layer
  const instancesByLayer = instances.reduce((acc, instance) => {
    if (!acc[instance.layerId]) {
      acc[instance.layerId] = [];
    }
    acc[instance.layerId].push(instance);
    return acc;
  }, {} as Record<string, typeof instances>);

  const handleDelete = (id: string) => {
    if (confirm('Delete this component instance?')) {
      removeInstance(id);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden" data-testid="component-instance-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted">
        <h3 className="text-sm font-semibold text-foreground">Component Instances</h3>
        <span className="text-xs text-muted-foreground">
          {instances.length} placed
        </span>
      </div>

      {/* Instance list */}
      <div className="max-h-64 overflow-y-auto">
        {instances.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No components placed yet.
            <br />
            Drag a component from the library to place it.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {/* Show instances grouped by layer, in reverse order (top layers first) */}
            {[...layers].reverse().map((layer) => {
              const layerInstances = instancesByLayer[layer.id] || [];
              if (layerInstances.length === 0) return null;

              return (
                <li key={layer.id}>
                  {/* Layer header */}
                  <div className="px-3 py-1.5 bg-muted/50 text-xs font-medium text-muted-foreground">
                    {layer.name}
                  </div>

                  {/* Instances in this layer */}
                  <ul className="divide-y divide-border/50">
                    {layerInstances.map((instance) => {
                      const component = getComponent(instance.componentId);
                      const isSelected = selectedInstanceId === instance.id;

                      return (
                        <li
                          key={instance.id}
                          className={`flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 border-l-2 border-l-primary'
                              : 'hover:bg-muted/50 border-l-2 border-l-transparent'
                          }`}
                          onClick={() => selectInstance(instance.id)}
                          data-testid={`instance-item-${instance.id}`}
                        >
                          {/* Instance info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate">
                              {component?.name || 'Unknown Component'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Position: ({instance.x}, {instance.y})
                            </div>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(instance.id);
                            }}
                            className="text-xs px-1.5 py-0.5 rounded text-muted-foreground hover:text-error hover:bg-error/10 transition-colors shrink-0"
                            title="Delete instance"
                          >
                            ✕
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
