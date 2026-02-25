/**
 * Diagram Cloud Sync — Supabase integration for diagram storage
 */

import { createClient } from '@/lib/supabase/client';
import type { DiagramItem } from '@/stores/diagram-store';

interface SupabaseDiagram {
  id: string;
  user_id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  layers: unknown;
  tags: string[];
  thumbnail: string | null;
  is_favorite: boolean;
  is_template: boolean;
  template_category: string | null;
  version: number;
  parent_id: string | null;
  cell_count: number;
  layer_count: number;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
}

function supabaseToLocal(d: SupabaseDiagram): DiagramItem {
  return {
    id: d.id,
    name: d.name,
    description: d.description || '',
    tags: d.tags || [],
    width: d.width,
    height: d.height,
    layers: d.layers as DiagramItem['layers'],
    thumbnail: d.thumbnail || '',
    isFavorite: d.is_favorite,
    isTemplate: d.is_template,
    templateCategory: d.template_category,
    version: d.version,
    parentId: d.parent_id,
    cellCount: d.cell_count,
    layerCount: d.layer_count,
    createdAt: new Date(d.created_at).getTime(),
    updatedAt: new Date(d.updated_at).getTime(),
    lastOpenedAt: d.last_opened_at ? new Date(d.last_opened_at).getTime() : null,
  };
}

function localToSupabase(d: DiagramItem, userId: string): Omit<SupabaseDiagram, 'created_at' | 'updated_at'> {
  return {
    id: d.id,
    user_id: userId,
    name: d.name,
    description: d.description,
    width: d.width,
    height: d.height,
    layers: d.layers,
    tags: d.tags,
    thumbnail: d.thumbnail || null,
    is_favorite: d.isFavorite,
    is_template: d.isTemplate,
    template_category: d.templateCategory,
    version: d.version,
    parent_id: d.parentId,
    cell_count: d.cellCount,
    layer_count: d.layerCount,
    last_opened_at: d.lastOpenedAt ? new Date(d.lastOpenedAt).toISOString() : null,
  };
}

export async function fetchUserDiagrams(): Promise<DiagramItem[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('diagrams')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch diagrams:', error);
    return [];
  }
  
  return (data || []).map(supabaseToLocal);
}

export async function saveDiagramToCloud(diagram: DiagramItem): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const record = localToSupabase(diagram, user.id);
  
  const { error } = await supabase
    .from('diagrams')
    .upsert(record, { onConflict: 'id' });
  
  if (error) {
    console.error('Failed to save diagram:', error);
    return false;
  }
  
  return true;
}

export async function deleteDiagramFromCloud(diagramId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { error } = await supabase
    .from('diagrams')
    .delete()
    .eq('id', diagramId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Failed to delete diagram:', error);
    return false;
  }
  
  return true;
}

export async function syncDiagrams(localDiagrams: DiagramItem[]): Promise<DiagramItem[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return localDiagrams;
  
  // Fetch cloud diagrams
  const cloudDiagrams = await fetchUserDiagrams();
  
  // Create maps for easy lookup
  const cloudMap = new Map(cloudDiagrams.map(d => [d.id, d]));
  const localMap = new Map(localDiagrams.map(d => [d.id, d]));
  
  const merged: DiagramItem[] = [];
  const toUpload: DiagramItem[] = [];
  
  // Process local diagrams
  for (const local of localDiagrams) {
    const cloud = cloudMap.get(local.id);
    
    if (!cloud) {
      // Only exists locally — upload to cloud
      toUpload.push(local);
      merged.push(local);
    } else if (local.updatedAt > cloud.updatedAt) {
      // Local is newer — use local and upload
      toUpload.push(local);
      merged.push(local);
    } else {
      // Cloud is newer or same — use cloud
      merged.push(cloud);
    }
    
    cloudMap.delete(local.id);
  }
  
  // Add diagrams that only exist in cloud
  for (const cloud of cloudMap.values()) {
    merged.push(cloud);
  }
  
  // Upload local-only or newer diagrams
  for (const diagram of toUpload) {
    await saveDiagramToCloud(diagram);
  }
  
  return merged;
}
