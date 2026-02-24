/**
 * ComponentCreationButton - Floating action button to create components
 */

'use client';

import { useState } from 'react';
import { CreateComponentDialog } from './CreateComponentDialog';
import { CanvasElement } from '@/types/component';

export function ComponentCreationButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Placeholder: In a real implementation, this would get selected elements from canvas
  const selectedElements: CanvasElement[] = [];

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center text-2xl font-bold z-40"
        title="Create component from selection"
      >
        +
      </button>

      <CreateComponentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        selectedElements={selectedElements}
      />
    </>
  );
}
