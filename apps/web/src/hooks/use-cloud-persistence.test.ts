import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCloudPersistence } from './use-cloud-persistence';
import { useCanvasStore } from '@/stores/canvas-store';

// Mock the dependencies
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    },
  }),
}));

vi.mock('@/app/actions/document-actions', () => ({
  updateDocument: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock navigator.onLine
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('useCloudPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset navigator.onLine to true
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
    
    // Reset canvas store
    const store = useCanvasStore.getState();
    store.document = null;
    store.activeLayerId = null;
  });

  it('should initialize with idle status', () => {
    const { result } = renderHook(() =>
      useCloudPersistence({ documentId: 'test-doc-id' })
    );

    expect(result.current.status).toBe('idle');
    expect(result.current.lastSaved).toBe(null);
    expect(result.current.isOnline).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should detect offline status', () => {
    const { result } = renderHook(() =>
      useCloudPersistence({ documentId: 'test-doc-id' })
    );

    act(() => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.status).toBe('offline');
  });

  it('should detect online status', () => {
    // Start offline
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() =>
      useCloudPersistence({ documentId: 'test-doc-id' })
    );

    expect(result.current.isOnline).toBe(false);

    // Go online
    act(() => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.status).toBe('idle');
  });

  it('should provide manual save function', () => {
    const { result } = renderHook(() =>
      useCloudPersistence({ documentId: 'test-doc-id' })
    );

    expect(typeof result.current.save).toBe('function');
  });

  it('should not save when disabled and manual save called', async () => {
    const { updateDocument } = await import('@/app/actions/document-actions');
    vi.mocked(updateDocument).mockClear();
    
    const { result } = renderHook(() =>
      useCloudPersistence({ documentId: 'test-doc-id', enabled: false })
    );

    // Manual save should not call updateDocument when there's no document
    await act(async () => {
      await result.current.save();
    });

    expect(updateDocument).not.toHaveBeenCalled();
  });

  it('should not save when no document ID', async () => {
    const { updateDocument } = await import('@/app/actions/document-actions');
    vi.mocked(updateDocument).mockClear();
    
    const { result } = renderHook(() =>
      useCloudPersistence({ documentId: null })
    );

    await act(async () => {
      await result.current.save();
    });

    expect(updateDocument).not.toHaveBeenCalled();
  });

  it('should not save when offline', async () => {
    const { updateDocument } = await import('@/app/actions/document-actions');
    vi.mocked(updateDocument).mockClear();
    
    // Set offline
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() =>
      useCloudPersistence({ documentId: 'test-doc-id' })
    );

    expect(result.current.isOnline).toBe(false);

    // Try manual save
    await act(async () => {
      await result.current.save();
    });

    expect(updateDocument).not.toHaveBeenCalled();
  });
});
