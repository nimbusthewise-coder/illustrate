import { create } from 'zustand';
import { CanvasDocument } from '@/types/canvas';

interface DocumentState {
  currentDocumentId: string | null;
  isLoading: boolean;
  error: string | null;
  setCurrentDocumentId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadDocument: (id: string) => Promise<void>;
  createNewDocument: (userId: string, title: string, width: number, height: number) => Promise<string | null>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  currentDocumentId: null,
  isLoading: false,
  error: null,

  setCurrentDocumentId: (id) => set({ currentDocumentId: id }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),

  loadDocument: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/documents/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load document');
      }
      
      const data: CanvasDocument = await response.json();
      
      // Import the canvas store dynamically to avoid circular dependency
      const { useCanvasStore } = await import('./canvas-store');
      const store = useCanvasStore.getState();
      
      // Set the document in the canvas store
      store.document = data;
      store.activeLayerId = data.layers[0]?.id || null;
      
      set({ currentDocumentId: id, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createNewDocument: async (userId: string, title: string, width: number, height: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const { useCanvasStore } = await import('./canvas-store');
      const canvasStore = useCanvasStore.getState();
      
      // Initialize a new document in the canvas store
      canvasStore.initializeDocument(width, height, title);
      const document = canvasStore.document;
      
      if (!document) {
        throw new Error('Failed to initialize document');
      }
      
      // Save to the server
      const { createDocument } = await import('@/app/actions/document-actions');
      const result = await createDocument({
        userId,
        title,
        width,
        height,
        isPublic: false,
        data: document,
      });
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create document');
      }
      
      const documentId = result.data.id;
      
      // Update the document ID in the canvas
      document.id = documentId;
      
      set({ currentDocumentId: documentId, isLoading: false });
      return documentId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create document';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },
}));
