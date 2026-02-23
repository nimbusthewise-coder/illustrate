# Usage Metering Integration Guide

## Quick Start

### 1. Run Database Migration

```bash
cd apps/web
npx prisma migrate dev --name add_usage_metering
npx prisma generate
```

### 2. Map Your Stripe Product IDs

Edit `apps/web/src/lib/usage-metering.ts`:

```typescript
const productTierMap: Record<string, SubscriptionTierId> = {
  'prod_ACTUAL_PRO_ID': 'pro',    // Replace with real Stripe product ID
  'prod_ACTUAL_TEAM_ID': 'team',  // Replace with real Stripe product ID
};
```

Find your Stripe product IDs in Stripe Dashboard → Products.

### 3. Integrate into AI Generation

#### Server Action Example

```typescript
// app/actions/ai-generation.ts
'use server';

import { recordAiGeneration, UsageLimitError } from '@/lib/usage-helpers';
import { auth } from '@/lib/auth';

export async function generateAiFlow(prompt: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Record usage BEFORE generation (enforces limit)
    await recordUsageOrThrow(session.user.id, 'ai_generation', 1, {
      prompt,
      timestamp: new Date().toISOString(),
    });

    // Perform AI generation
    const result = await performAiGeneration(prompt);

    return { success: true, result };
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return {
        success: false,
        error: 'AI generation limit reached',
        usage: {
          current: error.current,
          limit: error.limit,
        },
      };
    }
    throw error;
  }
}
```

#### API Route Example

```typescript
// app/api/ai/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { recordAiGeneration } from '@/lib/usage-helpers';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prompt } = await request.json();

  // Check and record usage
  const result = await recordAiGeneration(session.user.id, {
    prompt,
    requestedAt: new Date().toISOString(),
  });

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'AI generation limit exceeded',
        usage: result.usage,
      },
      { status: 429 }
    );
  }

  // Proceed with AI generation
  const generated = await performAiGeneration(prompt);

  return NextResponse.json({
    success: true,
    data: generated,
    usage: result.usage,
  });
}
```

### 4. Add UI Components

#### Dashboard Page

```tsx
// app/dashboard/page.tsx
import { UsageDisplay } from '@/components/UsageDisplay';
import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1>Dashboard</h1>
      <UsageDisplay userId={session.user.id} />
    </div>
  );
}
```

#### AI Generation Page

```tsx
// app/generate/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { AiGenerationButton } from '@/components/AiGenerationButton';
import { UsageDisplay } from '@/components/UsageDisplay';

export default function GeneratePage() {
  const { data: session } = useSession();

  const handleGenerate = async () => {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '...' }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error);
      return;
    }

    const data = await response.json();
    // Handle generated result
  };

  if (!session?.user) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>AI Generation</h1>
      
      {/* Compact usage counter */}
      <UsageDisplay userId={session.user.id} compact />
      
      {/* Generation button with built-in limit checking */}
      <AiGenerationButton
        userId={session.user.id}
        onGenerate={handleGenerate}
      />
    </div>
  );
}
```

### 5. Set Up Cleanup Cron Job

Create a scheduled task to run monthly:

```typescript
// scripts/cleanup-usage-records.ts
import { cleanupOldUsageRecords } from '@/lib/usage-metering';

async function main() {
  const deletedCount = await cleanupOldUsageRecords();
  console.log(`Cleaned up ${deletedCount} old usage records`);
}

main();
```

**Using Vercel Cron:**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-usage",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

```typescript
// app/api/cron/cleanup-usage/route.ts
import { NextResponse } from 'next/server';
import { cleanupOldUsageRecords } from '@/lib/usage-metering';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deletedCount = await cleanupOldUsageRecords();

  return NextResponse.json({
    success: true,
    deletedCount,
  });
}
```

## Advanced Usage

### Custom Usage Tracking

```typescript
import { recordUsage } from '@/lib/usage-metering';

// Track canvas creation
await recordUsage(userId, 'private_diagrams', 1, {
  canvasWidth: 256,
  canvasHeight: 256,
  title: 'My Dashboard',
});

// Bulk usage (team pooling)
await recordUsage(teamOwnerId, 'ai_generation', 10, {
  teamId: 'team_123',
  bulkOperation: true,
});
```

### Pre-flight Checks

```typescript
import { checkUsageLimit } from '@/lib/usage-metering';

const check = await checkUsageLimit(userId, 'ai_generation');

if (!check.allowed) {
  // Show upgrade prompt
  return {
    canProceed: false,
    message: `You've used ${check.current}/${check.limit} AI generations this month`,
    upgradeUrl: '/pricing',
  };
}
```

### Canvas Size Validation

```typescript
import { validateCanvasSize } from '@/lib/usage-helpers';

const validation = await validateCanvasSize(userId, 256, 256);

if (!validation.valid) {
  throw new Error(validation.reason);
  // "Canvas width 256 exceeds free tier limit of 120"
}
```

## Monitoring & Analytics

### Track Usage Trends

```typescript
// app/api/analytics/usage-trends/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
  const trends = await prisma.usageRecord.groupBy({
    by: ['feature', 'periodStart'],
    _sum: { count: true },
    orderBy: { periodStart: 'desc' },
    take: 12, // Last 12 months
  });

  return NextResponse.json(trends);
}
```

### User Approaching Limit Notifications

```typescript
import { getUserUsageStats } from '@/lib/usage-metering';

const stats = await getUserUsageStats(userId);
const aiUsage = stats.features.find((f) => f.feature === 'ai_generation');

if (aiUsage && aiUsage.percentage > 80) {
  // Send notification
  await sendEmail({
    to: user.email,
    subject: 'Approaching AI generation limit',
    body: `You've used ${aiUsage.current} of ${aiUsage.limit} AI generations this month.`,
  });
}
```

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { getCurrentBillingPeriod } from '@/lib/usage-metering';

describe('Usage Metering', () => {
  it('should return current month boundaries', () => {
    const { start, end } = getCurrentBillingPeriod();
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBeGreaterThan(27);
  });
});
```

### Integration Test Example

```typescript
// Requires test database
import { recordUsage, checkUsageLimit } from '@/lib/usage-metering';

test('should enforce free tier limits', async () => {
  const userId = 'test_user_free';

  // Record 5 uses (free tier limit)
  for (let i = 0; i < 5; i++) {
    await recordUsage(userId, 'ai_generation');
  }

  // 6th should fail
  const result = await recordUsage(userId, 'ai_generation');
  expect(result.success).toBe(false);

  // Check should show limit exceeded
  const check = await checkUsageLimit(userId, 'ai_generation');
  expect(check.allowed).toBe(false);
  expect(check.current).toBe(5);
  expect(check.limit).toBe(5);
});
```

## Troubleshooting

### Issue: Usage not resetting monthly

**Check**: Ensure `periodStart` and `periodEnd` are set correctly.

```typescript
const { start, end } = getCurrentBillingPeriod();
console.log('Current period:', start, 'to', end);
```

### Issue: Tier detection wrong

**Check**: Stripe product ID mapping in `getUserTier()`.

```typescript
const tier = await getUserTier(userId);
console.log('Detected tier:', tier);
```

### Issue: Type errors with Infinity

**Fix**: Use `-1` in database, convert to `Infinity` in code.

```typescript
limit: limit === -1 ? Infinity : limit
```

## Best Practices

1. **Always check limits before expensive operations**
2. **Record usage immediately after successful operations**
3. **Include metadata for debugging and analytics**
4. **Use `recordUsageOrThrow()` for simpler error handling**
5. **Display usage prominently in UI**
6. **Monitor usage patterns to optimize limits**

## Support

For questions or issues:
- Check `apps/web/src/lib/USAGE_METERING.md`
- Review implementation in `F066_IMPLEMENTATION_SUMMARY.md`
- Test with `pnpm test`
