'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { STRIPE_PLANS, type PlanType } from '@/lib/stripe';

interface SubscriptionData {
  tier: PlanType;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBillingData();
    }
  }, [status]);

  const fetchBillingData = async () => {
    try {
      const [subRes, invoicesRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/invoices'),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription);
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData.invoices);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: 'PRO' | 'TEAM') => {
    const planConfig = STRIPE_PLANS[plan];
    const priceId = planConfig.stripePriceId;
    if (!priceId) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, plan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading billing...</p>
        </div>
      </div>
    );
  }

  const currentPlan: PlanType = subscription?.tier || 'FREE';
  const isSubscribed = currentPlan !== 'FREE';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-foreground">Billing</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Plan */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Current Plan
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">
                {STRIPE_PLANS[currentPlan].name}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPlan === 'FREE'
                  ? 'Free forever'
                  : `$${STRIPE_PLANS[currentPlan].price}/mo`}
              </p>
              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground mt-1">
                  {subscription.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : subscription.status === 'active'
                      ? `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      : `Status: ${subscription.status}`}
                </p>
              )}
            </div>
            {isSubscribed && (
              <button
                onClick={handleManageSubscription}
                disabled={actionLoading}
                className="px-4 py-2 bg-muted text-foreground border border-border rounded-lg hover:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                Manage Subscription
              </button>
            )}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {isSubscribed ? 'Available Plans' : 'Choose a Plan'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <div className={`bg-card border rounded-xl p-6 ${currentPlan === 'FREE' ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
              <div className="mb-4">
                {currentPlan === 'FREE' && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    Current Plan
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">Free</h3>
              <p className="text-3xl font-bold text-foreground mb-4">
                $0<span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  Unlimited public diagrams
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  5 AI generations/month
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  120×60 canvas
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  1 design system
                </li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className={`bg-card border rounded-xl p-6 ${currentPlan === 'PRO' ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
              <div className="mb-4">
                {currentPlan === 'PRO' ? (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    Current Plan
                  </span>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    Most Popular
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">Pro</h3>
              <p className="text-3xl font-bold text-foreground mb-4">
                $8<span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  Unlimited private diagrams
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  100 AI generations/month
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  256×256 canvas
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  Unlimited design systems
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  API access
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  Priority support
                </li>
              </ul>
              {currentPlan !== 'PRO' && (
                <button
                  onClick={() => handleSubscribe('PRO')}
                  disabled={actionLoading || !STRIPE_PLANS.PRO.stripePriceId}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {currentPlan === 'TEAM' ? 'Switch to Pro' : 'Subscribe to Pro'}
                </button>
              )}
            </div>

            {/* Team Plan */}
            <div className={`bg-card border rounded-xl p-6 ${currentPlan === 'TEAM' ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
              <div className="mb-4">
                {currentPlan === 'TEAM' && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    Current Plan
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">Team</h3>
              <p className="text-3xl font-bold text-foreground mb-4">
                $12<span className="text-base font-normal text-muted-foreground">/user/mo</span>
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  Everything in Pro
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  Shared team library
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  500 AI generations/month (pooled)
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  SSO
                </li>
                <li className="text-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  Audit log
                </li>
              </ul>
              {currentPlan !== 'TEAM' && (
                <button
                  onClick={() => handleSubscribe('TEAM')}
                  disabled={actionLoading || !STRIPE_PLANS.TEAM.stripePriceId}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Subscribe to Team
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Invoices */}
        {invoices.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Billing History
            </h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        ${(invoice.amount / 100).toFixed(2)}{' '}
                        {invoice.currency.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-success/15 text-success'
                              : 'bg-warning/15 text-warning'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.hostedInvoiceUrl && (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Invoice
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
