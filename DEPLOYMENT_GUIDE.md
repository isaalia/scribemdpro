# ScribeMD Pro - Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables Setup

#### Vercel Environment Variables
Set these in your Vercel project settings (Settings → Environment Variables):

**Required:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEEPGRAM_API_KEY=your-deepgram-key
ANTHROPIC_API_KEY=your-anthropic-key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
EMAIL_FROM=ScribeMD Pro <noreply@scribemd.co>
```

**Optional:**
```
DRCHRONO_CLIENT_ID=your-drchrono-client-id
DRCHRONO_CLIENT_SECRET=your-drchrono-secret
DRCHRONO_REDIRECT_URI=https://your-domain.com/api/drchrono/callback
```

#### Frontend Environment Variables (Vercel)
These are automatically injected as `VITE_*` variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Database Setup

1. **Run Migrations**
   ```sql
   -- Run in Supabase SQL Editor:
   -- 1. packages/database/migrations/001_initial_schema.sql
   -- 2. packages/database/migrations/003_rls_policies.sql
   -- 3. SETUP_STORAGE_POLICIES.sql (for file uploads)
   ```

2. **Create Test User**
   ```sql
   -- Use your auth user ID from Supabase Auth
   INSERT INTO practices (id, name, subscription_tier) 
   VALUES ('00000000-0000-0000-0000-000000000001', 'Test Practice', 'professional');
   
   INSERT INTO users (id, email, full_name, role, practice_id)
   VALUES ('YOUR_AUTH_USER_ID', 'admin@scribemd.co', 'Admin User', 'admin', '00000000-0000-0000-0000-000000000001');
   ```

3. **Setup Storage Bucket**
   - Go to Supabase Dashboard → Storage
   - Create bucket: `patient-files`
   - Set to private
   - Run `SETUP_STORAGE_POLICIES.sql`

### 3. Stripe Setup

1. **Create Products & Prices**
   - Go to Stripe Dashboard → Products
   - Create three products:
     - Starter ($99/month)
     - Professional ($299/month)
     - Enterprise ($999/month)
   - Copy Price IDs to `apps/web/src/lib/plans.ts`

2. **Setup Webhook**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `invoice.payment_succeeded`
     - `customer.subscription.deleted`
   - Copy webhook signing secret to Vercel env vars

### 4. Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel link
   ```

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `apps/web/dist`
   - Install Command: `npm install`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### 5. Domain Setup

1. **Add Custom Domain**
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Add domain: `scribemd.co` (or your domain)
   - Follow DNS configuration instructions

2. **SSL Certificate**
   - Automatically provisioned by Vercel (Let's Encrypt)
   - No manual configuration needed

### 6. Post-Deployment Verification

- [ ] Login works
- [ ] Patient CRUD operations work
- [ ] Real-time transcription works
- [ ] SOAP generation works
- [ ] File uploads work
- [ ] PDF export works
- [ ] Stripe checkout works
- [ ] Webhook receives events
- [ ] Email notifications work
- [ ] Audit logs are being created
- [ ] Admin dashboard accessible

### 7. Monitoring Setup

1. **Vercel Analytics**
   - Enable in Vercel Dashboard → Analytics
   - Monitor performance metrics

2. **Error Tracking** (Optional)
   - Set up Sentry or similar
   - Add error boundary monitoring

3. **Database Monitoring**
   - Monitor Supabase dashboard
   - Set up alerts for high usage

## 🔒 Security Checklist

- [ ] All environment variables set in Vercel
- [ ] RLS policies tested and verified
- [ ] Audit logging verified working
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] CORS configured correctly
- [ ] API rate limiting configured
- [ ] File upload validation working
- [ ] SQL injection protection verified
- [ ] XSS protection verified

## 📋 HIPAA Compliance Checklist

- [ ] BAA signed with Supabase
- [ ] BAA signed with Vercel
- [ ] BAA signed with Deepgram
- [ ] BAA signed with Anthropic
- [ ] BAA signed with Stripe (if handling PHI)
- [ ] BAA signed with Resend
- [ ] Encryption at rest verified
- [ ] Encryption in transit verified
- [ ] Audit logging verified
- [ ] Access controls verified
- [ ] Incident response plan documented
- [ ] Privacy policy published
- [ ] Terms of service published

## 🐛 Troubleshooting

### Build Failures
- Check Vercel build logs
- Verify all environment variables are set
- Ensure `package.json` has correct `packageManager` field

### Database Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check Supabase project status
- Verify RLS policies are applied

### API Errors
- Check serverless function logs in Vercel
- Verify API keys are correct
- Check rate limits on external APIs

### Authentication Issues
- Verify user exists in both `auth.users` and `users` table
- Check RLS policies allow access
- Verify JWT token is valid

## 📞 Support

For issues or questions:
1. Check Vercel logs
2. Check Supabase logs
3. Review audit logs for access issues
4. Contact support@scribemd.co

