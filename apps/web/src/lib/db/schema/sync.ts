/**
 * Sync-related database schema types
 * F050: Cloud Persistence
 * 
 * These types mirror the Supabase table schemas for device sync.
 */

export interface SyncMetadata {
  id: string;
  userId: string;
  entityType: 'diagram' | 'layer' | 'settings' | 'preferences';
  entityId: string;
  version: number;
  checksum: string;
  lastModified: string;
  deviceId: string;
  data: unknown;
  isDeleted: boolean;
  conflictResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'web';
  lastSyncAt: string;
  lastSeen: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SyncState {
  id: string;
  deviceId: string;
  userId: string;
  documentId: string;
  version: number;
  lastSyncAt: string;
}

export interface SyncConflict {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  localVersion: SyncMetadata;
  remoteVersion: SyncMetadata;
  status: 'pending' | 'resolved' | 'ignored';
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: 'local' | 'remote' | 'merged';
  createdAt: string;
}

/**
 * SQL schemas for Cloud Persistence (F050)
 * Run these in Supabase SQL editor
 */

export const SYNC_METADATA_SCHEMA = `
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  checksum TEXT NOT NULL,
  last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id TEXT NOT NULL,
  data JSONB NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  conflict_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_metadata_user ON sync_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_entity ON sync_metadata(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_modified ON sync_metadata(last_modified);

ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own sync_metadata" ON sync_metadata
  FOR ALL USING (auth.uid() = user_id);
`;

export const DEVICES_SCHEMA = `
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own devices" ON devices
  FOR ALL USING (auth.uid() = user_id);
`;

export const SYNC_CONFLICTS_SCHEMA = `
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  local_version JSONB NOT NULL,
  remote_version JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conflicts_user_status ON sync_conflicts(user_id, status);

ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own conflicts" ON sync_conflicts
  FOR ALL USING (auth.uid() = user_id);
`;
