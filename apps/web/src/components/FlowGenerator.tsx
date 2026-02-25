/**
 * Flow Generator Component
 * F026: Prompt-to-Flow Generation
 * 
 * Main interface for prompt-to-flow generation.
 * Combines prompt input, status display, preview, and provider settings.
 */

'use client';

import { useState } from 'react';
import { PromptInput, ExamplePrompts } from './PromptInput';
import { GenerationPreview, GenerationStatus } from './GenerationPreview';
import { useFlowGeneration } from '@/hooks/useFlowGeneration';
import { useGenerationStore } from '@/stores/generationStore';
import { storeProvider, clearProvider } from '@/services/llmService';
import type { LLMProvider } from '@/types/prompt';

export interface FlowGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function FlowGenerator({ isOpen, onClose, className = '' }: FlowGeneratorProps) {
  const { setPrompt, error } = useFlowGeneration();
  const generationStore = useGenerationStore();
  const [showProviderSettings, setShowProviderSettings] = useState(false);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className={`fixed inset-0 z-40 flex items-start justify-center bg-background/80 backdrop-blur-sm overflow-y-auto ${className}`}>
        <div className="w-full max-w-4xl my-8 mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Generate Flow from Prompt</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Describe your flowchart in natural language and let AI create it for you
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProviderSettings(!showProviderSettings)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                aria-label="Settings"
                title="LLM Provider Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Provider Settings */}
            {showProviderSettings && (
              <ProviderSettings
                onClose={() => setShowProviderSettings(false)}
              />
            )}

            {/* Status */}
            <GenerationStatus />

            {/* Error Display */}
            {error && (
              <div className="px-4 py-3 bg-error/15 text-error border border-error/30 rounded-lg">
                <div className="font-medium text-sm">Generation Error</div>
                <div className="text-sm mt-1">{error}</div>
              </div>
            )}

            {/* Prompt Input */}
            <PromptInput autoFocus />

            {/* Example Prompts */}
            <ExamplePrompts onSelect={setPrompt} />
          </div>
        </div>
      </div>

      {/* Preview Modal (renders independently) */}
      <GenerationPreview />
    </>
  );
}

/**
 * Provider Settings Component
 */
interface ProviderSettingsProps {
  onClose: () => void;
}

function ProviderSettings({ onClose }: ProviderSettingsProps) {
  const { setProvider } = useFlowGeneration();
  const [providerType, setProviderType] = useState<'openai' | 'anthropic'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    const provider: LLMProvider = {
      name: providerType,
      apiKey: apiKey.trim(),
      model: model.trim() || (providerType === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022'),
    };

    storeProvider(provider);
    setProvider(provider);
    onClose();
  };

  const handleClear = () => {
    clearProvider();
    setProvider(null);
    setApiKey('');
    setModel('');
    onClose();
  };

  return (
    <div className="bg-muted rounded-lg p-6 space-y-4 border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">LLM Provider Settings</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Provider</label>
          <div className="flex gap-3">
            <button
              onClick={() => setProviderType('openai')}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                providerType === 'openai'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary/50'
              }`}
            >
              OpenAI
            </button>
            <button
              onClick={() => setProviderType('anthropic')}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                providerType === 'anthropic'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary/50'
              }`}
            >
              Anthropic
            </button>
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <label htmlFor="api-key" className="text-sm font-medium text-foreground">
            API Key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={providerType === 'openai' ? 'sk-...' : 'sk-ant-...'}
            className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Model (Optional) */}
        <div className="space-y-2">
          <label htmlFor="model" className="text-sm font-medium text-foreground">
            Model (optional)
          </label>
          <input
            id="model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={
              providerType === 'openai' 
                ? 'gpt-4o (default)' 
                : 'claude-3-5-sonnet-20241022 (default)'
            }
            className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground bg-background rounded-lg p-3">
          <strong>Note:</strong> Your API key is stored locally in your browser and never sent to our servers. 
          It&apos;s used only to communicate directly with {providerType === 'openai' ? 'OpenAI' : 'Anthropic'}.
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-error/15 text-error border border-error/30 rounded-lg
                       hover:bg-error/25 transition-all"
          >
            Clear Settings
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg
                       hover:opacity-90 transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
