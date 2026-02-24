/**
 * Diagram access control utilities
 * 
 * Handles authentication and authorization checks for diagram access.
 */

import { createClient } from '@/lib/supabase/server';

export interface DiagramRecord {
  id: string;
  title: string;
  content: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiagramAccessResult {
  diagram: DiagramRecord | null;
  error: string | null;
  status: number;
}

/**
 * Check access to a diagram by ID.
 * 
 * - Public diagrams are accessible to anyone
 * - Private diagrams require authentication and ownership
 * 
 * @param diagramId - The diagram ID to check access for
 * @returns Access result with diagram data or error
 */
export async function checkDiagramAccess(diagramId: string): Promise<DiagramAccessResult> {
  if (!diagramId || typeof diagramId !== 'string') {
    return { diagram: null, error: 'Invalid diagram ID', status: 400 };
  }

  const supabase = await createClient();

  // First try to fetch the diagram
  const { data: diagram, error: fetchError } = await supabase
    .from('diagrams')
    .select('*')
    .eq('id', diagramId)
    .single();

  if (fetchError || !diagram) {
    return { diagram: null, error: 'Diagram not found', status: 404 };
  }

  // If the diagram is public, allow access
  if (diagram.is_public) {
    return { diagram: diagram as DiagramRecord, error: null, status: 200 };
  }

  // For private diagrams, check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { diagram: null, error: 'Authentication required', status: 401 };
  }

  // Check ownership
  if (diagram.user_id !== user.id) {
    return { diagram: null, error: 'Access denied', status: 403 };
  }

  return { diagram: diagram as DiagramRecord, error: null, status: 200 };
}
