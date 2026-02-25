/**
 * Tests for F061: CLI Prompt-to-Flow Generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateFromPrompt } from '../services/ai-generation.js';
import { validatePrompt } from '../utils/prompt-handler.js';
import { suggestFilename } from '../utils/output-manager.js';

describe('F061: CLI Prompt-to-Flow Generation', () => {
  describe('generateFromPrompt', () => {
    it('should generate a document from a prompt', async () => {
      const result = await generateFromPrompt({
        prompt: 'user login flow',
        designSystem: 'standard',
        width: 80,
        height: 40
      });
      
      expect(result).toBeDefined();
      expect(result.document).toBeDefined();
      expect(result.document.title).toContain('Generated');
      expect(result.document.width).toBe(80);
      expect(result.document.height).toBe(40);
      expect(result.document.layers).toHaveLength(1);
      expect(result.metadata.prompt).toBe('user login flow');
      expect(result.metadata.designSystem).toBe('standard');
    });
    
    it('should respect custom dimensions', async () => {
      const result = await generateFromPrompt({
        prompt: 'test flow',
        width: 120,
        height: 60
      });
      
      expect(result.document.width).toBe(120);
      expect(result.document.height).toBe(60);
    });
    
    it('should use custom title if provided', async () => {
      const result = await generateFromPrompt({
        prompt: 'test flow',
        title: 'My Custom Diagram'
      });
      
      expect(result.document.title).toBe('My Custom Diagram');
    });
    
    it('should call progress callback', async () => {
      const onProgress = vi.fn();
      
      await generateFromPrompt(
        { prompt: 'test flow' },
        onProgress
      );
      
      expect(onProgress).toHaveBeenCalled();
      const calls = onProgress.mock.calls.map(call => call[0]);
      
      // Should have progress updates
      expect(calls.some(p => p.stage === 'analyzing')).toBe(true);
      expect(calls.some(p => p.stage === 'generating')).toBe(true);
      expect(calls.some(p => p.stage === 'complete')).toBe(true);
    });
    
    it('should use specified design system', async () => {
      const result = await generateFromPrompt({
        prompt: 'test flow',
        designSystem: 'mondrian'
      });
      
      expect(result.metadata.designSystem).toBe('mondrian');
      expect(result.document.designSystem).toBe('mondrian');
      expect(result.document.tags).toContain('mondrian');
    });
  });
  
  describe('validatePrompt', () => {
    it('should accept valid prompts', () => {
      const result = validatePrompt('user login flow with authentication');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should reject empty prompts', () => {
      const result = validatePrompt('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    it('should reject whitespace-only prompts', () => {
      const result = validatePrompt('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    it('should reject very short prompts', () => {
      const result = validatePrompt('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too short');
    });
    
    it('should reject very long prompts', () => {
      const longPrompt = 'a'.repeat(1001);
      const result = validatePrompt(longPrompt);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });
    
    it('should accept prompts at the minimum length', () => {
      const result = validatePrompt('login');
      expect(result.valid).toBe(true);
    });
  });
  
  describe('suggestFilename', () => {
    it('should generate filename from prompt', () => {
      const filename = suggestFilename('user login flow');
      expect(filename).toBe('user-login-flow.illustrate');
    });
    
    it('should handle special characters', () => {
      const filename = suggestFilename('User Login (with OAuth2.0)!');
      expect(filename).toBe('user-login-with-oauth20.illustrate');
    });
    
    it('should truncate long prompts', () => {
      const longPrompt = 'this is a very long prompt that should be truncated to a reasonable filename length';
      const filename = suggestFilename(longPrompt);
      expect(filename.length).toBeLessThan(70);
      expect(filename).toContain('.illustrate');
    });
    
    it('should support different formats', () => {
      expect(suggestFilename('test', 'illustrate')).toBe('test.illustrate');
      expect(suggestFilename('test', 'ascii')).toBe('test.txt');
      expect(suggestFilename('test', 'markdown')).toBe('test.md');
    });
    
    it('should handle empty prompts', () => {
      const filename = suggestFilename('');
      expect(filename).toBe('generated.illustrate');
    });
  });
  
  describe('placeholder diagram generation', () => {
    it('should create a placeholder diagram with informative text', async () => {
      const result = await generateFromPrompt({
        prompt: 'user registration flow',
        designSystem: 'mondrian',
        width: 80,
        height: 30
      });
      
      const buffer = result.document.layers[0].buffer;
      expect(buffer).toBeDefined();
      expect(buffer.width).toBe(80);
      expect(buffer.height).toBe(30);
      
      // Check that buffer contains some content
      const hasContent = Array.from(buffer.chars).some(cell => cell !== 0);
      expect(hasContent).toBe(true);
    });
    
    it('should include prompt in placeholder', async () => {
      const prompt = 'checkout process';
      const result = await generateFromPrompt({ prompt });
      
      const buffer = result.document.layers[0].buffer;
      const text = bufferToText(buffer);
      
      // Should contain some reference to the prompt or that it's a placeholder
      expect(text).toContain('ILLUSTRATE');
    });
  });
});

/**
 * Helper to convert buffer to text for inspection
 */
function bufferToText(buffer: { chars: Uint16Array; width: number; height: number }): string {
  const lines: string[] = [];
  
  for (let y = 0; y < buffer.height; y++) {
    let line = '';
    for (let x = 0; x < buffer.width; x++) {
      const charCode = buffer.chars[y * buffer.width + x];
      line += charCode > 0 ? String.fromCharCode(charCode) : ' ';
    }
    lines.push(line);
  }
  
  return lines.join('\n');
}
