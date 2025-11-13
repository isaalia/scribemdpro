# Stripe Subscription Setup Guide

## Step 1: Create Stripe Account and Products

1. Go to https://stripe.com and create an account
2. Navigate to **Products** in the Stripe Dashboard
3. Create three products with recurring pricing:

### Starter Plan
- **Product Name**: ScribeMD Pro - Starter
- **Price**: $99/month (recurring)
- **Billing Period**: Monthly
- Copy the **Price ID** (starts with `price_`)

### Professional Plan
- **Product Name**: ScribeMD Pro - Professional
- **Price**: $299/month (recurring)
- **Billing Period**: Monthly
- Copy the **Price ID**

### Enterprise Plan
- **Product Name**: ScribeMD Pro - Enterprise
- **Price**: $799/month (recurring)
- **Billing Period**: Monthly
- Copy the **Price ID**

## Step 2: Get Stripe API Keys

1. Go to **Developers** → **API keys** in Stripe Dashboard
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`) - keep this secure!

## Step 3: Set Up Webhook

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-domain.vercel.app/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 4: Update Environment Variables

### Frontend (.env.local)
```bash
VITE_STRIPE_PRICE_STARTER=price_xxxxx
VITE_STRIPE_PRICE_PROFESSIONAL=price_xxxxx
VITE_STRIPE_PRICE_ENTERPRISE=price_xxxxx
```

### Backend (Vercel Environment Variables)
```bash
STRIPE_SECRET_KEY=sk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 5: Update Database Schema

The practices table needs these fields. Run this SQL in Supabase:

```sql
-- Add missing subscription fields if they don't exist
ALTER TABLE practices 
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50),
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP;

-- Update subscription_status to use 'inactive' instead of null
UPDATE practices 
SET subscription_status = 'inactive' 
WHERE subscription_status IS NULL;
```

## Step 6: Test Subscription Flow

1. Use Stripe test mode for development
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date and CVC
4. Complete checkout and verify webhook receives events
5. Check that practice subscription_status updates in database

## Troubleshooting

- **Webhook not receiving events**: Check endpoint URL is correct and publicly accessible
- **Subscription not updating**: Verify webhook secret matches in environment variables
- **Checkout fails**: Ensure Stripe API keys are correct and in correct mode (test/live)

