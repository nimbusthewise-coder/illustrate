import { describe, it, expect } from 'vitest';

/**
 * Parse version from ID string if it contains @v syntax
 * e.g., "abc123@v2" => { id: "abc123", version: 2 }
 */
function parseVersionedId(id: string): { id: string; version: number | null } {
  const versionMatch = id.match(/^(.+)@v(\d+)$/);
  if (versionMatch) {
    return {
      id: versionMatch[1],
      version: parseInt(versionMatch[2], 10),
    };
  }
  return { id, version: null };
}

describe('parseVersionedId', () => {
  it('should parse versioned ID with @v syntax', () => {
    expect(parseVersionedId('abc123@v2')).toEqual({
      id: 'abc123',
      version: 2,
    });
  });

  it('should parse versioned ID with multiple digits', () => {
    expect(parseVersionedId('xyz789@v123')).toEqual({
      id: 'xyz789',
      version: 123,
    });
  });

  it('should handle ID without version', () => {
    expect(parseVersionedId('abc123')).toEqual({
      id: 'abc123',
      version: null,
    });
  });

  it('should handle ID with @ but no version', () => {
    expect(parseVersionedId('abc@something')).toEqual({
      id: 'abc@something',
      version: null,
    });
  });

  it('should handle ID with multiple @ symbols', () => {
    expect(parseVersionedId('abc@test@v5')).toEqual({
      id: 'abc@test',
      version: 5,
    });
  });

  it('should return null version for v0', () => {
    expect(parseVersionedId('abc@v0')).toEqual({
      id: 'abc',
      version: 0,
    });
  });
});
