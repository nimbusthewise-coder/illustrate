# Usage Metering System

This document describes the usage metering system for illustrate.md, which tracks AI generation usage and enforces subscription tier limits.

## Overview

The usage metering system tracks resource consumption per user and enforces limits based on subscription tiers (Free, Pro, Team). It's designed to:

1. **Track usage** - Record AI generation and other metered features
2. **Enforce limits** - Prevent usage beyond subscription tier allowances
3. **Provide visibility** - Show users their current usage and limits

## Architecture

### Database Schema

The `UsageRecord` model stores individual usage events:

```prisma
model UsageRecord {
  id           String   @id @default(cuid())
  userId       String
  feature      String   // 'ai_generation', 'canvas_size', etc.
  count        Int      @default(1)
  metadata     Json?    // Additional context
  periodStart  DateTime // Billing period start
  periodEnd    DateTime // Billing period end
  createdAt    DateTime @default(now())
  
  user         User     @relation(...)
}
```

### Subscription Tiers

Defined in `lib/usage-metering.ts`:

| Tier | AI Generations/month | Private Diagrams | Max Canvas Size |
|------|---------------------|------------------|-----------------|
| Free | 5 | 0 | 120×60 |
| Pro | 100 | Unlimited | 256×256 |
| Team | 500 (pooled) | Unlimited | 256×256 |

### Metered Features

- `ai_generation` - AI flow generation prompts
- `private_diagrams` - Count of private diagrams
- `max_canvas_width` - Maximum allowed canvas width
- `max_canvas_height` - Maximum allowed canvas height
- `custom_design_systems` - Number of custom design systems

## Usage

### Server-Side

```typescript
import { recordUsage, checkUsageLimit } from '@/lib/usage-metering';
import { recordAiGeneration, canGenerateAi } from '@/lib/usage-helpers';

// Check if user can generate AI content
const canUse = await canGenerateAi(userId);
if (!canUse) {
  throw new Error('AI generation limit reached');
}

// Record AI generation
const result = await recordAiGeneration(userId, {
  prompt: 'Create a dashboard layout',
  canvasWidth: 120,
  canvasHeight: 40,
});

if (!result.success) {
  // Limit exceeded
  console.log(`Usage: ${result.usage.current}/${result.usage.limit}`);
}
```

### Client-Side

```tsx
import { UsageDisplay } from '@/components/UsageDisplay';
import { useUsageStats } from '@/hooks/use-usage-metering';

// Full usage display
<UsageDisplay userId={user.id} />

// Compact display
<UsageDisplay userId={user.id} compact />

// Custom hook
function MyComponent() {
  const { stats, isLoading } = useUsageStats(user.id);
  
  const aiUsage = stats?.features.find(f => f.feature === 'ai_generation');
  
  return (
    <div>
      AI generations: {aiUsage?.current} / {aiUsage?.limit}
    </div>
  );
}
```

### API Routes

Three endpoints are available:

1. **GET `/api/usage/stats?userId={id}`** - Get all usage stats
2. **GET `/api/usage/check?userId={id}&feature={feature}`** - Check specific feature limit
3. **POST `/api/usage/record`** - Record a usage event

```typescript
// Example: Recording usage via API
const response = await fetch('/api/usage/record', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    feature: 'ai_generation',
    count: 1,
    metadata: { prompt: '...' },
  }),
});

if (response.status === 429) {
  // Limit exceeded
  const { usage } = await response.json();
  alert(`Limit reached: ${usage.current}/${usage.limit}`);
}
```

## Billing Period

Usage is tracked per billing period (monthly):
- Period starts on the 1st of the month at 00:00:00
- Period ends on the last day of the month at 23:59:59
- Usage automatically resets at the start of each new period

## Data Retention

Old usage records are cleaned up after 12 months to keep the database lean. Run the cleanup function periodically:

```typescript
import { cleanupOldUsageRecords } from '@/lib/usage-metering';

// In a cron job or scheduled task
const deletedCount = await cleanupOldUsageRecords();
console.log(`Cleaned up ${deletedCount} old usage records`);
```

## Error Handling

The `UsageLimitError` class is thrown when limits are exceeded:

```typescript
import { recordUsageOrThrow, UsageLimitError } from '@/lib/usage-helpers';

try {
  await recordUsageOrThrow(userId, 'ai_generation');
} catch (error) {
  if (error instanceof UsageLimitError) {
    // Handle limit exceeded
    console.log(`${error.feature}: ${error.current}/${error.limit}`);
  }
}
```

## Testing

Unit tests are in `lib/usage-metering.test.ts`. Key test scenarios:

- Billing period calculation
- Tier limit definitions
- Usage counting
- Limit enforcement

Run tests:
```bash
npm test
```

## Future Enhancements

- Team pooling: Track team-level usage for Team tier
- Usage webhooks: Notify when users approach limits
- Usage analytics: Track trends over time
- Rollover credits: Allow unused AI generations to roll over
