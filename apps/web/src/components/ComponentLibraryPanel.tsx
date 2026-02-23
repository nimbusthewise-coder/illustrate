'use client';

import { useState } from 'react';
import { useDesignSystemStore } from '@/stores/design-system-store';
import { useCanvasStore } from '@/stores/canvas-store';
import { Component, ComponentRole, Slot, PropDefinition, PropType, PropOverrides } from '@/types/design-system';

const roleLabels: Record<ComponentRole, string> = {
  container: 'Container',
  navigation: 'Navigation',
  input: 'Input',
  display: 'Display',
  layout: 'Layout',
  feedback: 'Feedback',
};

const propTypeLabels: Record<PropType, string> = {
  text: 'Text',
  number: 'Number',
  boolean: 'Yes/No',
  choice: 'Choice',
};

interface SlotDraft {
  name: string;
  x: string;
  y: string;
  width: string;
  height: string;
  default: string;
}

interface PropDraft {
  name: string;
  type: PropType;
  default: string;
  choices: string;
  description: string;
}

function createEmptySlotDraft(): SlotDraft {
  return { name: '', x: '0', y: '0', width: '10', height: '1', default: '' };
}

function createEmptyPropDraft(): PropDraft {
  return { name: '', type: 'text', default: '', choices: '', description: '' };
}

export function ComponentLibraryPanel() {
  const { activeDesignSystem, addComponent, removeComponent } = useDesignSystemStore();
  const { selection, document, activeLayerId, clearSelection } = useCanvasStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPlaceDialog, setShowPlaceDialog] = useState<Component | null>(null);
  const [componentName, setComponentName] = useState('');
  const [componentDescription, setComponentDescription] = useState('');
  const [componentRole, setComponentRole] = useState<ComponentRole>('container');
  const [componentTags, setComponentTags] = useState('');
  const [slotDrafts, setSlotDrafts] = useState<SlotDraft[]>([]);
  const [propDrafts, setPropDrafts] = useState<PropDraft[]>([]);
  const [propOverrides, setPropOverrides] = useState<PropOverrides>({});

  const resetForm = () => {
    setComponentName('');
    setComponentDescription('');
    setComponentRole('container');
    setComponentTags('');
    setSlotDrafts([]);
    setPropDrafts([]);
  };

  const handleAddSlot = () => {
    setSlotDrafts([...slotDrafts, createEmptySlotDraft()]);
  };

  const handleRemoveSlot = (index: number) => {
    setSlotDrafts(slotDrafts.filter((_, i) => i !== index));
  };

  const handleUpdateSlot = (index: number, field: keyof SlotDraft, value: string) => {
    setSlotDrafts(slotDrafts.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleAddProp = () => {
    setPropDrafts([...propDrafts, createEmptyPropDraft()]);
  };

  const handleRemoveProp = (index: number) => {
    setPropDrafts(propDrafts.filter((_, i) => i !== index));
  };

  const handleUpdateProp = (index: number, field: keyof PropDraft, value: string) => {
    setPropDrafts(propDrafts.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleCreateFromSelection = () => {
    if (!selection || !document || !activeLayerId) {
      return;
    }

    const layer = document.layers.find((l) => l.id === activeLayerId);
    if (!layer) {
      return;
    }

    // Convert slot drafts to Slot objects
    const slots: Slot[] = slotDrafts
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        x: parseInt(s.x, 10) || 0,
        y: parseInt(s.y, 10) || 0,
        width: parseInt(s.width, 10) || 1,
        height: parseInt(s.height, 10) || 1,
        default: s.default,
      }));

    // Convert prop drafts to PropDefinition objects
    const props: PropDefinition[] = propDrafts
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        type: p.type,
        default: p.default,
        choices: p.type === 'choice' ? p.choices.split(',').map((c) => c.trim()).filter(Boolean) : undefined,
        description: p.description || undefined,
      }));

    const { createComponentFromRegion } = useDesignSystemStore.getState();
    
    const component = createComponentFromRegion(
      componentName || 'New Component',
      componentDescription,
      componentRole,
      layer.buffer,
      selection.startCol,
      selection.startRow,
      selection.endCol,
      selection.endRow,
      slots,
      componentTags.split(',').map((t) => t.trim()).filter(Boolean),
      props
    );

    if (component) {
      addComponent(component);
      setShowCreateDialog(false);
      clearSelection();
      resetForm();
    }
  };

  const handleDeleteComponent = (componentId: string) => {
    if (confirm('Are you sure you want to delete this component?')) {
      removeComponent(componentId);
    }
  };

  const handlePlaceComponent = (component: Component) => {
    if (component.props.length > 0 || component.slots.length > 0) {
      // Show prop override dialog
      const defaults: PropOverrides = {};
      for (const slot of component.slots) {
        defaults[slot.name] = slot.default;
      }
      for (const prop of component.props) {
        defaults[prop.name] = prop.default;
      }
      setPropOverrides(defaults);
      setShowPlaceDialog(component);
    } else {
      // Place directly at 0,0 on active layer
      const { placeComponent } = useCanvasStore.getState();
      placeComponent(component, 0, 0);
    }
  };

  const handleConfirmPlace = () => {
    if (!showPlaceDialog) return;
    const { placeComponent } = useCanvasStore.getState();
    placeComponent(showPlaceDialog, 0, 0, undefined, propOverrides);
    setShowPlaceDialog(null);
    setPropOverrides({});
  };

  const renderComponentPreview = (component: Component) => {
    const { template } = component;
    const preview: string[] = [];
    
    // Render up to 5 lines for preview
    const maxLines = Math.min(5, template.height);
    for (let row = 0; row < maxLines; row++) {
      let line = '';
      for (let col = 0; col < template.width; col++) {
        const index = row * template.width + col;
        const charCode = template.chars[index];
        line += charCode ? String.fromCharCode(charCode) : ' ';
      }
      preview.push(line);
    }
    
    return preview.join('\n');
  };

  if (!activeDesignSystem) {
    return (
      <div className="h-full bg-muted/50 p-4 border-l border-border">
        <div className="text-center text-muted-foreground text-sm">
          <p>No active design system</p>
          <p className="mt-2 text-xs">Create a design system to start building components</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm text-foreground">Component Library</h2>
        <p className="text-xs text-muted-foreground mt-1">{activeDesignSystem.name}</p>
      </div>

      {/* Create from selection button */}
      {selection && (
        <div className="p-3 bg-accent/10 border-b border-border">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create Component from Selection
          </button>
        </div>
      )}

      {/* Component list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeDesignSystem.components.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-8">
            <p>No components yet</p>
            <p className="mt-2">Select a region on the canvas to create a component</p>
          </div>
        ) : (
          activeDesignSystem.components.map((component) => (
            <div
              key={component.id}
              className="p-3 bg-card border border-border rounded-lg hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {component.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {roleLabels[component.role]}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handlePlaceComponent(component)}
                    className="text-primary hover:text-primary/80 text-xs p-1"
                    title="Place on canvas"
                  >
                    ⊕
                  </button>
                  <button
                    onClick={() => handleDeleteComponent(component.id)}
                    className="text-muted-foreground hover:text-error text-xs p-1"
                    title="Delete component"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {component.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {component.description}
                </p>
              )}

              {/* Preview */}
              <div className="bg-muted/50 p-2 rounded font-mono text-[10px] leading-tight overflow-hidden whitespace-pre">
                {renderComponentPreview(component)}
              </div>

              {/* Metadata */}
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                  {component.minWidth}×{component.minHeight}
                </span>
                {component.slots.length > 0 && (
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                    {component.slots.length} slot{component.slots.length !== 1 ? 's' : ''}
                  </span>
                )}
                {component.props.length > 0 && (
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                    {component.props.length} prop{component.props.length !== 1 ? 's' : ''}
                  </span>
                )}
                {component.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create component dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Create Component</h3>
            </div>

            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground"
                  placeholder="e.g. Button, Modal, Card"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={componentDescription}
                  onChange={(e) => setComponentDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground resize-none"
                  rows={2}
                  placeholder="Describe this component..."
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Role
                </label>
                <select
                  value={componentRole}
                  onChange={(e) => setComponentRole(e.target.value as ComponentRole)}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground"
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={componentTags}
                  onChange={(e) => setComponentTags(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground"
                  placeholder="button, primary, cta"
                />
              </div>

              {/* Slots */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Slots
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    + Add Slot
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Define editable regions within the component template.
                </p>
                {slotDrafts.map((slot, index) => (
                  <div key={index} className="p-2 bg-muted/30 border border-border rounded mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Slot {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(index)}
                        className="text-xs text-muted-foreground hover:text-error"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      value={slot.name}
                      onChange={(e) => handleUpdateSlot(index, 'name', e.target.value)}
                      className="w-full px-2 py-1 bg-background border border-input rounded text-xs text-foreground"
                      placeholder="Slot name (e.g. title, body)"
                    />
                    <div className="grid grid-cols-4 gap-1">
                      <div>
                        <label className="text-[10px] text-muted-foreground">X</label>
                        <input
                          type="number"
                          value={slot.x}
                          onChange={(e) => handleUpdateSlot(index, 'x', e.target.value)}
                          className="w-full px-1 py-0.5 bg-background border border-input rounded text-xs text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Y</label>
                        <input
                          type="number"
                          value={slot.y}
                          onChange={(e) => handleUpdateSlot(index, 'y', e.target.value)}
                          className="w-full px-1 py-0.5 bg-background border border-input rounded text-xs text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">W</label>
                        <input
                          type="number"
                          value={slot.width}
                          onChange={(e) => handleUpdateSlot(index, 'width', e.target.value)}
                          className="w-full px-1 py-0.5 bg-background border border-input rounded text-xs text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">H</label>
                        <input
                          type="number"
                          value={slot.height}
                          onChange={(e) => handleUpdateSlot(index, 'height', e.target.value)}
                          className="w-full px-1 py-0.5 bg-background border border-input rounded text-xs text-foreground"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={slot.default}
                      onChange={(e) => handleUpdateSlot(index, 'default', e.target.value)}
                      className="w-full px-2 py-1 bg-background border border-input rounded text-xs text-foreground"
                      placeholder="Default text"
                    />
                  </div>
                ))}
              </div>

              {/* Props */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Props
                  </label>
                  <button
                    type="button"
                    onClick={handleAddProp}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    + Add Prop
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Define properties that can be overridden when placing this component.
                </p>
                {propDrafts.map((prop, index) => (
                  <div key={index} className="p-2 bg-muted/30 border border-border rounded mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Prop {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProp(index)}
                        className="text-xs text-muted-foreground hover:text-error"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      value={prop.name}
                      onChange={(e) => handleUpdateProp(index, 'name', e.target.value)}
                      className="w-full px-2 py-1 bg-background border border-input rounded text-xs text-foreground"
                      placeholder="Prop name (e.g. label, variant)"
                    />
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="text-[10px] text-muted-foreground">Type</label>
                        <select
                          value={prop.type}
                          onChange={(e) => handleUpdateProp(index, 'type', e.target.value)}
                          className="w-full px-1 py-0.5 bg-background border border-input rounded text-xs text-foreground"
                        >
                          {Object.entries(propTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Default</label>
                        <input
                          type="text"
                          value={prop.default}
                          onChange={(e) => handleUpdateProp(index, 'default', e.target.value)}
                          className="w-full px-1 py-0.5 bg-background border border-input rounded text-xs text-foreground"
                          placeholder="Default value"
                        />
                      </div>
                    </div>
                    {prop.type === 'choice' && (
                      <input
                        type="text"
                        value={prop.choices}
                        onChange={(e) => handleUpdateProp(index, 'choices', e.target.value)}
                        className="w-full px-2 py-1 bg-background border border-input rounded text-xs text-foreground"
                        placeholder="Choices (comma-separated)"
                      />
                    )}
                    <input
                      type="text"
                      value={prop.description}
                      onChange={(e) => handleUpdateProp(index, 'description', e.target.value)}
                      className="w-full px-2 py-1 bg-background border border-input rounded text-xs text-foreground"
                      placeholder="Description (optional)"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => { setShowCreateDialog(false); resetForm(); }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFromSelection}
                disabled={!componentName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Place component with prop overrides dialog */}
      {showPlaceDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[60vh] overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">
                Place: {showPlaceDialog.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Override prop values before placing on canvas.
              </p>
            </div>

            <div className="p-4 space-y-3">
              {/* Slot overrides */}
              {showPlaceDialog.slots.map((slot) => (
                <div key={`slot-${slot.name}`}>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {slot.name} <span className="text-muted-foreground">(slot)</span>
                  </label>
                  <input
                    type="text"
                    value={propOverrides[slot.name] ?? slot.default}
                    onChange={(e) => setPropOverrides({ ...propOverrides, [slot.name]: e.target.value })}
                    className="w-full px-2 py-1.5 bg-background border border-input rounded text-sm text-foreground"
                    placeholder={slot.default || `Enter ${slot.name}...`}
                  />
                </div>
              ))}

              {/* Prop overrides */}
              {showPlaceDialog.props.map((prop) => (
                <div key={`prop-${prop.name}`}>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {prop.name}
                    {prop.description && (
                      <span className="text-muted-foreground ml-1">— {prop.description}</span>
                    )}
                  </label>
                  {prop.type === 'choice' && prop.choices ? (
                    <select
                      value={propOverrides[prop.name] ?? prop.default}
                      onChange={(e) => setPropOverrides({ ...propOverrides, [prop.name]: e.target.value })}
                      className="w-full px-2 py-1.5 bg-background border border-input rounded text-sm text-foreground"
                    >
                      {prop.choices.map((choice) => (
                        <option key={choice} value={choice}>{choice}</option>
                      ))}
                    </select>
                  ) : prop.type === 'boolean' ? (
                    <select
                      value={propOverrides[prop.name] ?? prop.default}
                      onChange={(e) => setPropOverrides({ ...propOverrides, [prop.name]: e.target.value })}
                      className="w-full px-2 py-1.5 bg-background border border-input rounded text-sm text-foreground"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      type={prop.type === 'number' ? 'number' : 'text'}
                      value={propOverrides[prop.name] ?? prop.default}
                      onChange={(e) => setPropOverrides({ ...propOverrides, [prop.name]: e.target.value })}
                      className="w-full px-2 py-1.5 bg-background border border-input rounded text-sm text-foreground"
                      placeholder={prop.default || `Enter ${prop.name}...`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => { setShowPlaceDialog(null); setPropOverrides({}); }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPlace}
                className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Place
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
