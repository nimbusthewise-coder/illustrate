import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return new NextResponse('No signature', { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new NextResponse('Webhook signature verification failed', {
        status: 400,
      });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const priceId = subscription.items.data[0]?.price.id;
  const productId = subscription.items.data[0]?.price.product as string;
  const status = subscription.status;
  const currentPeriodStart = new Date((subscription as any).current_period_start * 1000);
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;
  const canceledAt = subscription.canceled_at
    ? new Date(subscription.canceled_at * 1000)
    : null;

  // Find user by customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: currentPeriodEnd,
    },
  });

  // Upsert subscription
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId || '',
      stripeProductId: productId || '',
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      canceledAt,
    },
    update: {
      stripePriceId: priceId || '',
      stripeProductId: productId || '',
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      canceledAt,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;

  // Update subscription status
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  // Update user
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (sub) {
    await prisma.user.update({
      where: { id: sub.userId },
      data: {
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const invoiceId = invoice.id;

  // Find user by customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Create invoice record
  await prisma.invoice.create({
    data: {
      userId: user.id,
      stripeInvoiceId: invoiceId,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'paid',
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const invoiceId = invoice.id;

  // Find user by customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update or create invoice record
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoiceId },
    create: {
      userId: user.id,
      stripeInvoiceId: invoiceId,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'open',
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    },
    update: {
      status: 'open',
    },
  });
}
