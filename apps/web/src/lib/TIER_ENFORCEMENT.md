# Tier Enforcement System

Complete implementation of F067 (Tier enforcement) - gate features by subscription level.

## Overview

The tier enforcement system works in conjunction with the usage metering system (F066) to enforce subscription limits across the application. It prevents users from accessing features or creating content that exceeds their tier limits.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Components                         │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ UpgradePrompt  │  │ TierLimitsDisplay│  │  TierBadge   │ │
│  └────────────────┘  └─────────────────┘  └──────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     React Hooks                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  use-tier-enforcement.ts                               │ │
│  │  - useTierLimits()                                     │ │
│  │  - useCanCreatePrivate()                               │ │
│  │  - useCanvasSize()                                     │ │
│  │  - useCanCreateDesignSystem()                          │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
│  /api/tier/limits                                            │
│  /api/tier/enforce/private-document                          │
│  /api/tier/enforce/canvas-size                               │
│  /api/tier/enforce/design-system                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Server Actions                              │
│  document-actions.ts  │  design-system-actions.ts           │
│  - createDocument()   │  - createDesignSystem()             │
│  - updateDocument()   │  - updateDesignSystem()             │
│  - deleteDocument()   │  - deleteDesignSystem()             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Enforcement Layer (tier-enforcement.ts)         │
│  - enforcePrivateDocumentCreation()                          │
│  - enforceCanvasSize()                                       │
│  - enforceDesignSystemCreation()                             │
│  - enforceDocumentOperation()                                │
│  - getUserFeatureAccess()                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│        Usage Metering (usage-metering.ts, F066)              │
│  - getUserTier()                                             │
│  - checkUsageLimit()                                         │
│  - SUBSCRIPTION_TIERS                                        │
└─────────────────────────────────────────────────────────────┘
```

## Tier Limits

| Feature | Free | Pro | Team |
|---------|------|-----|------|
| Private diagrams | ❌ 0 | ✅ Unlimited | ✅ Unlimited |
| Canvas size | 120×60 | 256×256 | 256×256 |
| AI generations/month | 5 | 100 | 500 (pooled) |
| Custom design systems | 1 | Unlimited | Unlimited |
| Embed badge | Required | Optional | Optional |

## Core Functions

### Enforcement Functions

#### `enforcePrivateDocumentCreation(userId: string)`

Checks if a user can create private documents.

```typescript
const result = await enforcePrivateDocumentCreation(userId);
// {
//   allowed: false,
//   reason: 'Private diagrams are not available on the Free tier...',
//   tier: 'free',
//   upgradeRequired: true
// }
```

#### `enforceCanvasSize(userId: string, width: number, height: number)`

Validates canvas dimensions against tier limits.

```typescript
const result = await enforceCanvasSize(userId, 200, 100);
// {
//   allowed: false,
//   reason: 'Canvas size 200×100 exceeds your tier limit (120×60)',
//   tier: 'free',
//   upgradeRequired: true
// }
```

#### `enforceDesignSystemCreation(userId: string)`

Checks if user can create another custom design system.

```typescript
const result = await enforceDesignSystemCreation(userId);
// {
//   allowed: false,
//   reason: 'You have reached the limit of 1 custom design system...',
//   tier: 'free',
//   upgradeRequired: true
// }
```

#### `enforceDocumentOperation(userId: string, documentId: string, operation: 'read' | 'update' | 'delete')`

Validates document access permissions.

```typescript
const result = await enforceDocumentOperation(userId, docId, 'update');
// {
//   allowed: false,
//   reason: 'You do not have permission to access this document',
//   tier: 'free'
// }
```

### Utility Functions

#### `getUserFeatureAccess(userId: string)`

Get comprehensive feature access information.

```typescript
const access = await getUserFeatureAccess(userId);
// {
//   tier: 'free',
//   features: {
//     privateDocuments: false,
//     maxCanvasSize: { width: 120, height: 60 },
//     customDesignSystems: 1,
//     aiGenerationsPerMonth: 5
//   }
// }
```

#### `getUpgradeMessage(feature: FeatureType, tier: SubscriptionTierId)`

Get user-friendly upgrade message for a feature.

```typescript
const message = getUpgradeMessage('private_diagrams', 'free');
// "Upgrade to Pro to create private diagrams."
```

## Server Actions

### Document Actions

All document operations enforce tier limits automatically.

#### Create Document

```typescript
import { createDocument } from '@/app/actions/document-actions';

const result = await createDocument({
  userId: 'user_123',
  title: 'My Diagram',
  width: 120,
  height: 60,
  isPublic: false, // Will fail for free tier
  data: canvasData,
});

if (!result.success) {
  if (result.upgradeRequired) {
    // Show upgrade prompt
    console.log(result.error);
  }
}
```

#### Update Document

```typescript
import { updateDocument } from '@/app/actions/document-actions';

const result = await updateDocument({
  userId: 'user_123',
  documentId: 'doc_456',
  updates: {
    width: 200, // Will fail if exceeds tier limit
    height: 200,
  },
});
```

#### Delete Document

```typescript
import { deleteDocument } from '@/app/actions/document-actions';

const result = await deleteDocument({
  userId: 'user_123',
  documentId: 'doc_456',
});
```

### Design System Actions

#### Create Design System

```typescript
import { createDesignSystem } from '@/app/actions/design-system-actions';

const result = await createDesignSystem({
  userId: 'user_123',
  name: 'My Custom System',
  description: 'A custom design system',
  data: designSystemData,
});

if (!result.success && result.upgradeRequired) {
  // Free tier user has reached limit of 1
  showUpgradePrompt(result.error);
}
```

## React Hooks

### `useTierLimits(userId)`

Get user's tier and feature limits.

```tsx
import { useTierLimits } from '@/hooks/use-tier-enforcement';

function Dashboard({ userId }) {
  const { limits, loading } = useTierLimits(userId);
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      <p>Tier: {limits.tier}</p>
      <p>Private docs: {limits.features.privateDocuments ? 'Yes' : 'No'}</p>
      <p>Max canvas: {limits.features.maxCanvasSize.width}×{limits.features.maxCanvasSize.height}</p>
    </div>
  );
}
```

### `useCanCreatePrivate(userId)`

Check if user can create private documents.

```tsx
import { useCanCreatePrivate } from '@/hooks/use-tier-enforcement';
import { UpgradePrompt } from '@/components/UpgradePrompt';

function CreateDocumentDialog({ userId }) {
  const { allowed, reason, upgradeRequired, loading } = useCanCreatePrivate(userId);
  const [isPublic, setIsPublic] = useState(true);
  
  return (
    <div>
      <label>
        <input 
          type="checkbox" 
          checked={!isPublic}
          onChange={(e) => setIsPublic(!e.target.checked)}
          disabled={!allowed}
        />
        Private
      </label>
      
      {!allowed && upgradeRequired && (
        <UpgradePrompt message={reason} tier="free" />
      )}
    </div>
  );
}
```

### `useCanvasSize(userId, width, height)`

Validate canvas dimensions.

```tsx
import { useCanvasSize } from '@/hooks/use-tier-enforcement';

function CanvasSizeInput({ userId }) {
  const [width, setWidth] = useState(120);
  const [height, setHeight] = useState(60);
  const { allowed, reason } = useCanvasSize(userId, width, height);
  
  return (
    <div>
      <input value={width} onChange={(e) => setWidth(Number(e.target.value))} />
      <input value={height} onChange={(e) => setHeight(Number(e.target.value))} />
      
      {!allowed && <p className="text-error">{reason}</p>}
    </div>
  );
}
```

### `useCanCreateDesignSystem(userId)`

Check design system creation limits.

```tsx
import { useCanCreateDesignSystem } from '@/hooks/use-tier-enforcement';

function CreateDesignSystemButton({ userId }) {
  const { allowed, reason, upgradeRequired } = useCanCreateDesignSystem(userId);
  
  return (
    <button disabled={!allowed}>
      Create Design System
      {!allowed && upgradeRequired && (
        <Tooltip>{reason}</Tooltip>
      )}
    </button>
  );
}
```

## UI Components

### `<UpgradePrompt>`

Display upgrade message when limits are hit.

```tsx
import { UpgradePrompt } from '@/components/UpgradePrompt';

<UpgradePrompt
  title="Upgrade Required"
  message="Private diagrams are not available on the Free tier."
  tier="free"
  variant="banner" // or "modal" or "inline"
/>
```

### `<UpgradeButton>`

Compact upgrade button.

```tsx
import { UpgradeButton } from '@/components/UpgradePrompt';

<UpgradeButton tier="free" size="small" />
```

### `<TierBadge>`

Display user's tier.

```tsx
import { TierBadge } from '@/components/TierBadge';

<TierBadge tier="pro" size="default" />
```

### `<TierLimitsDisplay>`

Full tier limits display with usage stats.

```tsx
import { TierLimitsDisplay } from '@/components/TierLimitsDisplay';

<TierLimitsDisplay userId={user.id} />
```

### `<TierComparison>`

Pricing page comparison.

```tsx
import { TierComparison } from '@/components/TierBadge';

<TierComparison />
```

## API Routes

### GET /api/tier/limits

Get user's feature access.

```bash
GET /api/tier/limits?userId=user_123
```

Response:
```json
{
  "tier": "free",
  "features": {
    "privateDocuments": false,
    "maxCanvasSize": { "width": 120, "height": 60 },
    "customDesignSystems": 1,
    "aiGenerationsPerMonth": 5
  }
}
```

### GET /api/tier/enforce/private-document

Check private document permission.

```bash
GET /api/tier/enforce/private-document?userId=user_123
```

Response:
```json
{
  "allowed": false,
  "reason": "Private diagrams are not available on the Free tier...",
  "tier": "free",
  "upgradeRequired": true
}
```

### GET /api/tier/enforce/canvas-size

Validate canvas dimensions.

```bash
GET /api/tier/enforce/canvas-size?userId=user_123&width=200&height=100
```

### GET /api/tier/enforce/design-system

Check design system creation.

```bash
GET /api/tier/enforce/design-system?userId=user_123
```

## Database Schema

The tier enforcement system uses the existing Prisma schema with added relations:

```prisma
model User {
  // ... existing fields
  designSystems DesignSystem[]
  documents     Document[]
}

model Document {
  // ... existing fields
  user User? @relation(fields: [userId], references: [id])
}

model DesignSystem {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  version     String   @default("1.0.0")
  data        Json
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}
```

## Testing

```bash
# Run tier enforcement tests
pnpm test tier-enforcement.test.ts
```

## Common Patterns

### Prevent Action on Limit

```tsx
function CreateButton({ userId }) {
  const { allowed, reason, upgradeRequired } = useCanCreatePrivate(userId);
  
  const handleCreate = async () => {
    if (!allowed) {
      toast.error(reason);
      if (upgradeRequired) {
        showUpgradeModal();
      }
      return;
    }
    
    // Proceed with creation
    await createDocument({ userId, isPublic: false, ... });
  };
  
  return <button onClick={handleCreate}>Create Private Document</button>;
}
```

### Show Upgrade Prompt Inline

```tsx
function FeatureSection({ userId }) {
  const { allowed } = useCanCreatePrivate(userId);
  
  return (
    <div>
      {!allowed && (
        <UpgradePrompt
          message="Upgrade to Pro to create private diagrams"
          tier="free"
          variant="banner"
        />
      )}
      
      <DocumentList userId={userId} />
    </div>
  );
}
```

## Integration with F066 (Usage Metering)

Tier enforcement builds on top of usage metering:

1. **Usage Metering (F066)** tracks actual usage counts
2. **Tier Enforcement (F067)** prevents actions that would exceed limits

```typescript
// F066: Track usage
await recordAiGeneration(userId);

// F067: Prevent exceeding limits
const check = await enforcePrivateDocumentCreation(userId);
if (!check.allowed) {
  return { error: check.reason };
}
```

## Migration Required

After implementing tier enforcement, run:

```bash
cd apps/web
npx prisma migrate dev --name add_tier_enforcement
npx prisma generate
```

## Summary

F067 (Tier enforcement) provides:

✅ Complete enforcement layer for subscription limits
✅ Server actions with built-in enforcement
✅ React hooks for client-side checks
✅ UI components for upgrade prompts
✅ API routes for enforcement checks
✅ Type-safe TypeScript throughout
✅ Comprehensive documentation
✅ Test coverage

All tier limits are enforced before operations occur, with clear user feedback and upgrade paths.
