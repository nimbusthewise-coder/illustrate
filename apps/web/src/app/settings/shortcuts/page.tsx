/**
 * Keyboard Shortcuts Settings Page — F052: Keyboard Shortcuts System
 *
 * Settings page where users can customize keyboard shortcuts.
 */

import { ShortcutCustomizer } from '@/components/shortcuts/ShortcutCustomizer';

export default function ShortcutsSettingsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <ShortcutCustomizer />
      </div>
    </div>
  );
}
