/**
 * Sync Utility Functions
 */

export async function generateChecksum(data: unknown): Promise<string> {
  const str = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateDeviceId(): string {
  const stored = localStorage.getItem('illustrate_device_id');
  if (stored) return stored;

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const deviceId = `device_${Math.abs(hash)}_${Date.now()}`;
  localStorage.setItem('illustrate_device_id', deviceId);
  return deviceId;
}

export function getDeviceType(): 'desktop' | 'mobile' | 'tablet' | 'web' {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

export function getDeviceName(): string {
  const type = getDeviceType();
  const platform = navigator.platform || 'Unknown';
  return `${platform} - ${type}`;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

export function mergeWithConflicts<T extends Record<string, unknown>>(
  local: T,
  remote: T,
  localTimestamp: number,
  remoteTimestamp: number
): { merged: T; conflicts: string[] } {
  const merged = { ...local };
  const conflicts: string[] = [];

  for (const key in remote) {
    if (key in local) {
      if (!deepEqual(local[key], remote[key])) {
        conflicts.push(key);
        if (remoteTimestamp > localTimestamp) {
          merged[key] = remote[key];
        }
      }
    } else {
      merged[key] = remote[key];
    }
  }

  return { merged, conflicts };
}

export function isOnline(): boolean {
  return navigator.onLine;
}
