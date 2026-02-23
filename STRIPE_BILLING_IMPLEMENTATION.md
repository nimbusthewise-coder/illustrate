# Stripe Billing Integration Implementation

## Overview

This implementation provides complete Stripe billing integration for the illustrate.md project, including:

- **Subscription Management**: Pro and Team tier subscriptions
- **Payment Processing**: Stripe Checkout for new subscriptions
- **Billing Portal**: Customer portal for subscription management
- **Invoicing**: Automated invoice tracking and display
- **Webhook Handling**: Real-time subscription and payment event processing

## Features Implemented

### 1. Database Schema

Extended Prisma schema with three new models:

**User Model Extensions:**
- `stripeCustomerId`: Unique Stripe customer ID
- `stripeSubscriptionId`: Current subscription ID
- `stripePriceId`: Current price tier
- `stripeCurrentPeriodEnd`: Subscription renewal date

**Subscription Model:**
- Complete subscription tracking
- Status management (active, canceled, past_due)
- Period tracking
- Cancel-at-period-end support

**Invoice Model:**
- Invoice history tracking
- PDF and hosted invoice URLs
- Payment status tracking
- Amount and currency information

### 2. Stripe Configuration

**File:** `apps/web/src/lib/stripe.ts`

- Stripe client initialization
- Pricing plan definitions (FREE, PRO, TEAM)
- Plan feature matrices
- Helper functions for plan detection and feature access

**Pricing Tiers:**

| Plan | Price | Features |
|------|-------|----------|
| FREE | $0/mo | Public diagrams, 5 AI generations/month, 120×60 canvas, 1 design system |
| PRO | $8/mo | Everything + unlimited private diagrams, 100 AI generations/month, 256×256 canvas, API access |
| TEAM | $12/user/mo | Everything in Pro + team library, SSO, audit log, 500 AI generations/month (pooled) |

### 3. API Routes

#### Webhook Handler
**Route:** `/api/webhooks/stripe`

Processes Stripe webhook events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Updates database in real-time when subscription status changes.

#### Checkout Session Creator
**Route:** `/api/stripe/create-checkout-session`

Creates Stripe Checkout sessions for new subscriptions. Handles:
- Customer creation (if needed)
- Subscription setup
- Success/cancel URL redirects

#### Billing Portal Session Creator
**Route:** `/api/stripe/create-portal-session`

Creates Stripe Customer Portal sessions for subscription management.

#### Subscription Data Fetcher
**Route:** `/api/billing/subscription`

Returns user's current subscription details.

#### Invoice Data Fetcher
**Route:** `/api/billing/invoices`

Returns user's invoice history.

### 4. UI Components

#### Billing Page
**File:** `apps/web/src/app/billing/page.tsx`

Full-featured billing management page with:
- Current plan display
- Subscription status
- Pricing tier comparison
- Upgrade buttons
- Invoice history table
- Manage subscription button (opens Stripe portal)

#### Subscription Badge
**File:** `apps/web/src/components/SubscriptionBadge.tsx`

Displays current plan as a badge in the UI. Shows:
- Plan tier (FREE, PRO, TEAM)
- Cancellation status
- Click-through to billing page

#### Upgrade Prompt
**File:** `apps/web/src/components/UpgradePrompt.tsx`

Two components for feature gating:

**`<UpgradePrompt>`**: Shows upgrade message for locked features
**`<FeatureGate>`**: Conditionally renders content based on plan

Example usage:
```tsx
<FeatureGate 
  feature="Unlimited private diagrams" 
  requiredPlan="PRO"
  fallback={<UpgradePrompt />}
>
  <PrivateDiagramsUI />
</FeatureGate>
```

### 5. Custom Hooks

#### useSubscription Hook
**File:** `apps/web/src/hooks/useSubscription.ts`

React hook for subscription state management:

```tsx
const {
  subscription,    // Current subscription object
  plan,            // Current plan tier
  loading,         // Loading state
  isActive,        // Is subscription active?
  isPro,           // Is Pro tier?
  isTeam,          // Is Team tier?
  isFree,          // Is Free tier?
  hasFeature,      // Check if plan has a feature
  canAccessFeature,// Check if user can access a feature
  getFeatureLimit, // Get limit for a feature
  refetch,         // Refresh subscription data
} = useSubscription();
```

## Setup Instructions

### 1. Install Dependencies

Already installed:
```bash
pnpm add stripe @stripe/stripe-js
```

### 2. Configure Stripe

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Create two products in Stripe:
   - **Pro Plan**: $8/month recurring
   - **Team Plan**: $12/user/month recurring
4. Copy the price IDs for each product

### 3. Configure Environment Variables

Update `apps/web/.env`:

```bash
# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_TEAM_PRICE_ID="price_..."
```

### 4. Set Up Webhook Endpoint

1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Run Database Migration

When the database is running:

```bash
cd apps/web
npx prisma migrate dev --name add_stripe_billing
```

Or for production:

```bash
npx prisma migrate deploy
```

### 6. Generate Prisma Client

```bash
cd apps/web
npx prisma generate
```

## Testing

### Local Testing with Stripe CLI

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3021/api/webhooks/stripe
   ```
4. Use test card: `4242 4242 4242 4242` (any future date, any CVC)

### Test Scenarios

1. **Subscribe to Pro**
   - Visit `/billing`
   - Click "Subscribe to Pro"
   - Complete checkout with test card
   - Verify subscription appears on billing page
   - Check database for subscription record

2. **View Invoices**
   - After successful payment, invoice should appear in billing history
   - Click "View" to open hosted invoice URL

3. **Manage Subscription**
   - Click "Manage Subscription" button
   - Should open Stripe Customer Portal
   - Test canceling subscription
   - Verify "Canceling" status appears

4. **Feature Gating**
   - Add `<FeatureGate>` to a component
   - Verify free users see upgrade prompt
   - Subscribe to Pro
   - Verify content is now visible

## File Structure

```
apps/web/
├── prisma/
│   └── schema.prisma              # Updated with billing models
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── billing/
│   │   │   │   ├── invoices/
│   │   │   │   │   └── route.ts  # Fetch invoices
│   │   │   │   └── subscription/
│   │   │   │       └── route.ts  # Fetch subscription
│   │   │   ├── stripe/
│   │   │   │   ├── create-checkout-session/
│   │   │   │   │   └── route.ts  # Create checkout
│   │   │   │   └── create-portal-session/
│   │   │   │       └── route.ts  # Create portal
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts  # Handle webhooks
│   │   └── billing/
│   │       └── page.tsx           # Billing management UI
│   ├── components/
│   │   ├── SubscriptionBadge.tsx  # Plan badge
│   │   └── UpgradePrompt.tsx      # Feature gate components
│   ├── hooks/
│   │   └── useSubscription.ts     # Subscription hook
│   └── lib/
│       ├── auth.ts                 # NextAuth config
│       ├── prisma.ts               # Prisma client
│       └── stripe.ts               # Stripe config & helpers
├── .env                            # Environment variables
└── .env.example                    # Example env vars
```

## Security Considerations

1. **Webhook Signature Verification**: All webhook events are verified using `stripe.webhooks.constructEvent()` with the webhook secret

2. **Server-Side Only**: Stripe secret key is only used in API routes (server-side), never exposed to client

3. **Authentication Required**: All billing API routes check for authenticated session before processing

4. **Customer ID Validation**: Webhook handlers verify customer ID matches a user in the database before updating

## Next Steps

### Phase 6 Additional Features (F066-F073)

1. **F066: Usage Metering**
   - Track AI generation usage
   - Display usage in billing dashboard
   - Enforce limits based on plan

2. **F067: Tier Enforcement**
   - Implement middleware for feature access control
   - Block actions that exceed plan limits
   - Show upgrade prompts at point of use

3. **F068: Badge/Branding on Free Embeds**
   - Add "Made with illustrate.md" badge to free tier embeds
   - Remove badge for Pro/Team tiers

4. **F069: Team Workspace**
   - Shared diagram library for teams
   - Team member management UI
   - Role-based access control

5. **F070: Seat Management**
   - Add/remove team members
   - Update Stripe subscription quantity
   - Prorated billing

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is correct in Stripe Dashboard
   - Verify webhook secret is set correctly
   - Check server logs for errors
   - Use Stripe CLI for local testing

2. **Subscription not updating**
   - Check webhook event was received
   - Verify customer ID matches in database
   - Check Prisma schema is up to date

3. **Checkout session fails**
   - Verify price IDs are correct
   - Check Stripe account is activated
   - Ensure `NEXT_PUBLIC_APP_URL` is correct

## Related PRD Sections

- **§14.2**: Pricing Tiers (FREE, PRO, TEAM)
- **§14.3**: Phase 6 Features (F065-F073)
- **§6.9**: Authentication & Accounts (F046-F051)

## Implementation Complete ✅

All core billing functionality has been implemented:
- ✅ Subscription management
- ✅ Payment processing (Stripe Checkout)
- ✅ Invoice tracking
- ✅ Webhook handling
- ✅ Billing UI
- ✅ Feature gating components
- ✅ Subscription hooks

Ready for testing and deployment once Stripe is configured.
