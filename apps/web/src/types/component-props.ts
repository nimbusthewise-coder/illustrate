/**
 * F020: Reusable Named Component Props
 */

export type PropType = 'text' | 'number' | 'boolean' | 'choice';

export interface PropDefinition {
  name: string;
  type: PropType;
  default: string;
  choices?: string[];
  description?: string;
}

export type PropOverrides = Record<string, string>;

export function applyPropOverridesToBuffer(
  buffer: { chars: Uint16Array; fg: Uint32Array; bg: Uint32Array; width: number; height: number },
  slots: Array<{ name: string; x: number; y: number; width: number; height: number; default: string }>,
  propOverrides: PropOverrides,
  offsetCol: number = 0,
  offsetRow: number = 0,
): void {
  for (const slot of slots) {
    const overrideValue = propOverrides[slot.name];
    const textToWrite = overrideValue !== undefined ? overrideValue : slot.default;
    if (!textToWrite) continue;
    let charIndex = 0;
    for (let slotRow = 0; slotRow < slot.height && charIndex < textToWrite.length; slotRow++) {
      for (let slotCol = 0; slotCol < slot.width && charIndex < textToWrite.length; slotCol++) {
        const canvasCol = offsetCol + slot.x + slotCol;
        const canvasRow = offsetRow + slot.y + slotRow;
        if (canvasCol >= 0 && canvasCol < buffer.width && canvasRow >= 0 && canvasRow < buffer.height) {
          const canvasIndex = canvasRow * buffer.width + canvasCol;
          buffer.chars[canvasIndex] = textToWrite.charCodeAt(charIndex);
          buffer.fg[canvasIndex] = 0xFFFFFF;
          buffer.bg[canvasIndex] = 0x000000;
        }
        charIndex++;
      }
    }
  }
}

export function validatePropOverrides(props: PropDefinition[], overrides: PropOverrides): string[] {
  const errors: string[] = [];
  for (const prop of props) {
    const value = overrides[prop.name];
    if (value === undefined) continue;
    switch (prop.type) {
      case 'number': if (isNaN(Number(value))) errors.push(`Prop "${prop.name}" must be a number, got "${value}"`); break;
      case 'boolean': if (value !== 'true' && value !== 'false') errors.push(`Prop "${prop.name}" must be "true" or "false", got "${value}"`); break;
      case 'choice': if (prop.choices && !prop.choices.includes(value)) errors.push(`Prop "${prop.name}" must be one of [${prop.choices.join(', ')}], got "${value}"`); break;
    }
  }
  return errors;
}

export function resolvePropValue(props: PropDefinition[], propName: string, overrides?: PropOverrides): string | undefined {
  const prop = props.find((p) => p.name === propName);
  if (!prop) return undefined;
  if (overrides && overrides[propName] !== undefined) return overrides[propName];
  return prop.default;
}
