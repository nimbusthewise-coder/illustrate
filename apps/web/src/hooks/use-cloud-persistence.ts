'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { updateDocument } from '@/app/actions/document-actions';
import { useSession } from 'next-auth/react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface CloudPersistenceOptions {
  documentId: string | null;
  autoSaveDelay?: number; // milliseconds
  enabled?: boolean;
}

interface CloudPersistenceResult {
  status: SaveStatus;
  lastSaved: Date | null;
  isOnline: boolean;
  save: () => Promise<void>;
  error: string | null;
}

/**
 * Hook for cloud persistence with auto-save and offline detection
 * 
 * Features:
 * - Auto-save on edit (debounced)
 * - Manual save trigger
 * - Offline detection
 * - Last-write-wins conflict resolution
 */
export function useCloudPersistence(
  options: CloudPersistenceOptions
): CloudPersistenceResult {
  const { documentId, autoSaveDelay = 2000, enabled = true } = options;
  const { data: session, status: sessionStatus } = useSession();
  const { document } = useCanvasStore();
  
  // Only enable cloud persistence if session is authenticated
  const hasSession = sessionStatus === 'authenticated' && session?.user?.id;
  
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDocumentRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  /**
   * Detect online/offline status
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('idle');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Save document to cloud
   */
  const saveToCloud = useCallback(async () => {
    if (!document || !documentId || !hasSession || !session?.user?.id || !isOnline) {
      return;
    }

    // Prevent concurrent saves
    if (isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      setStatus('saving');
      setError(null);

      const result = await updateDocument({
        userId: session.user.id,
        documentId,
        updates: {
          title: document.title,
          width: document.width,
          height: document.height,
          data: document,
        },
      });

      if (result.success) {
        setStatus('saved');
        setLastSaved(new Date());
        lastDocumentRef.current = JSON.stringify(document);
        
        // Reset to idle after a brief moment
        setTimeout(() => {
          setStatus('idle');
        }, 1500);
      } else {
        setStatus('error');
        setError(result.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Save error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      isSavingRef.current = false;
    }
  }, [document, documentId, hasSession, session?.user?.id, isOnline]);

  /**
   * Manual save trigger
   */
  const save = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await saveToCloud();
  }, [saveToCloud]);

  /**
   * Auto-save when document changes
   */
  useEffect(() => {
    if (!enabled || !document || !documentId || !hasSession || !session?.user?.id || !isOnline) {
      return;
    }

    // Skip if document hasn't changed
    const currentDocStr = JSON.stringify(document);
    if (currentDocStr === lastDocumentRef.current) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveToCloud();
    }, autoSaveDelay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [document, documentId, hasSession, session?.user?.id, enabled, isOnline, autoSaveDelay, saveToCloud]);

  /**
   * Save when going offline (attempt to save pending changes)
   */
  useEffect(() => {
    if (!isOnline && saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, [isOnline]);

  return {
    status,
    lastSaved,
    isOnline,
    save,
    error,
  };
}
