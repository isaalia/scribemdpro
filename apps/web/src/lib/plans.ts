// Subscription plans configuration
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER || '',
    features: ['Up to 5 users', '500 encounters/month', 'Basic support'],
  },
  professional: {
    name: 'Professional',
    price: 299,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL || '',
    features: ['Up to 20 users', 'Unlimited encounters', 'Priority support', 'Advanced analytics'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 799,
    priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || '',
    features: ['Unlimited users', 'Unlimited encounters', '24/7 support', 'Custom integrations', 'Dedicated account manager'],
  },
}

