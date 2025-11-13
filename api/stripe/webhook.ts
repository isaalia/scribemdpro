import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const practiceId = session.metadata?.practice_id

        if (!practiceId) {
          console.error('Missing practice_id in checkout session metadata')
          break
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        // Update practice subscription
        await supabase
          .from('practices')
          .update({
            subscription_status: 'active',
            subscription_plan: session.metadata?.plan_id,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_start_date: new Date().toISOString(),
          })
          .eq('id', practiceId)

        // Log subscription event
        await supabase.from('subscription_events').insert({
          practice_id: practiceId,
          event_type: 'subscription_created',
          stripe_subscription_id: subscription.id,
          metadata: {
            plan_id: session.metadata?.plan_id,
            amount: subscription.items.data[0]?.price.unit_amount,
          },
        })

        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Find practice by customer ID
        const { data: practice } = await supabase
          .from('practices')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (!practice) {
          console.error('Practice not found for customer:', subscription.customer)
          break
        }

        const status = subscription.status === 'active' ? 'active' : 'canceled'

        await supabase
          .from('practices')
          .update({
            subscription_status: status,
            stripe_subscription_id: subscription.id,
          })
          .eq('id', practice.id)

        // Log subscription event
        await supabase.from('subscription_events').insert({
          practice_id: practice.id,
          event_type: event.type === 'customer.subscription.deleted' ? 'subscription_canceled' : 'subscription_updated',
          stripe_subscription_id: subscription.id,
        })

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Find practice
        const { data: practice } = await supabase
          .from('practices')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (practice) {
          // Create invoice record
          await supabase.from('invoices').insert({
            practice_id: practice.id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'paid',
            paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
          })
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Find practice
        const { data: practice } = await supabase
          .from('practices')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (practice) {
          // Update subscription status
          await supabase
            .from('practices')
            .update({
              subscription_status: 'past_due',
            })
            .eq('id', practice.id)

          // Log invoice record
          await supabase.from('invoices').insert({
            practice_id: practice.id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: 'failed',
          })
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return res.status(500).json({ error: error.message })
  }
}

