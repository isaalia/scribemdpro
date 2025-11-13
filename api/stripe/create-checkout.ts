import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// Subscription plans - must match frontend plans.ts
const PLANS = {
  starter: {
    name: 'Starter',
    price: 99,
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    features: ['Up to 5 users', '500 encounters/month', 'Basic support'],
  },
  professional: {
    name: 'Professional',
    price: 299,
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || '',
    features: ['Up to 20 users', 'Unlimited encounters', 'Priority support', 'Advanced analytics'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 799,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
    features: ['Unlimited users', 'Unlimited encounters', '24/7 support', 'Custom integrations', 'Dedicated account manager'],
  },
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { practice_id, plan_id, success_url, cancel_url } = req.body

  if (!practice_id || !plan_id) {
    return res.status(400).json({ error: 'practice_id and plan_id are required' })
  }

  const plan = PLANS[plan_id as keyof typeof PLANS]
  if (!plan) {
    return res.status(400).json({ error: 'Invalid plan_id' })
  }

  if (!plan.priceId) {
    return res.status(500).json({ error: 'Stripe price ID not configured for this plan' })
  }

  try {
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || `${req.headers.origin}/admin/subscriptions?success=true`,
      cancel_url: cancel_url || `${req.headers.origin}/admin/subscriptions?canceled=true`,
      client_reference_id: practice_id,
      metadata: {
        practice_id,
        plan_id,
      },
    })

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to create checkout session',
    })
  }
}

