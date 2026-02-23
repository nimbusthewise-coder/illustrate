'use client';

import { useState } from 'react';
import { useFeatureLimit } from '@/hooks/use-usage-metering';

interface AiGenerationButtonProps {
  userId: string;
  onGenerate: () => Promise<void>;
  disabled?: boolean;
}

export function AiGenerationButton({ 
  userId, 
  onGenerate,
  disabled = false 
}: AiGenerationButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { limitCheck, isLoading } = useFeatureLimit(userId, 'ai-generation');

  const handleClick = async () => {
    if (!limitCheck?.allowed) {
      alert(`AI generation limit reached. Please upgrade your plan.`);
      return;
    }

    try {
      setIsGenerating(true);
      await onGenerate();
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate AI content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = disabled || isLoading || isGenerating || !limitCheck?.allowed;
  const showWarning = limitCheck && !limitCheck.allowed;

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          px-4 py-2 rounded-lg font-medium transition-colors
          ${isDisabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90'
          }
        `}
      >
        {isGenerating ? 'Generating...' : 'Generate with AI'}
      </button>

      {!isLoading && limitCheck && (
        <div className="text-xs text-muted-foreground">
          {limitCheck.current} / {limitCheck.limit === Infinity ? '∞' : limitCheck.limit} used this month
        </div>
      )}

      {showWarning && (
        <div className="bg-warning/15 text-warning text-sm px-3 py-2 rounded">
          ⚠️ You've reached your AI generation limit. 
          <a href="/pricing" className="underline ml-1">Upgrade to Pro</a>
        </div>
      )}
    </div>
  );
}
