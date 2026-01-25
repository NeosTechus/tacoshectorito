# Deployment Guide - El Torito Restaurant

This guide covers everything you need to deploy this restaurant ordering app to Vercel with all features working.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [MongoDB Atlas Setup](#1-mongodb-atlas-setup)
3. [Stripe Setup](#2-stripe-setup)
4. [Resend Email Setup](#3-resend-email-setup-optional)
5. [Google OAuth Setup](#4-google-oauth-setup-optional)
6. [Environment Variables](#5-environment-variables-summary)
7. [Vercel Deployment](#6-vercel-deployment)
8. [Post-Deployment Configuration](#7-post-deployment-configuration)
9. [Testing Your Deployment](#8-testing-your-deployment)
10. [Troubleshooting](#9-troubleshooting)
11. [Alternative Hosting Options](#10-alternative-hosting-options)
12. [Monitoring & Analytics](#11-monitoring--analytics)
13. [Cost Estimation](#12-cost-estimation)
14. [Security Best Practices](#13-security-best-practices)

---

## Prerequisites

Before starting, ensure you have:

- [ ] A [GitHub](https://github.com) account (for Vercel deployment)
- [ ] A [Vercel](https://vercel.com) account (free tier works)
- [ ] A [MongoDB Atlas](https://cloud.mongodb.com) account (free tier works)
- [ ] A [Stripe](https://stripe.com) account (test mode is free)
- [ ] (Optional) A [Resend](https://resend.com) account for order emails
- [ ] (Optional) A [Google Cloud](https://console.cloud.google.com) account for Google Sign-In

---

## 1. MongoDB Atlas Setup

MongoDB stores all orders, users, and session data.

### Step 1.1: Create a Free Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) and sign up/log in
2. Click **"Build a Database"**
3. Choose **"M0 FREE"** tier
4. Select a cloud provider and region close to your users
5. Click **"Create Cluster"** (takes 1-3 minutes)

### Step 1.2: Create a Database User

1. In the left sidebar, go to **Security → Database Access**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., `restaurant_app`)
5. Click **"Autogenerate Secure Password"** and **save this password**
6. Under "Database User Privileges", select **"Read and write to any database"**
7. Click **"Add User"**

### Step 1.3: Configure Network Access

1. Go to **Security → Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - ⚠️ This is required for Vercel serverless functions
4. Click **"Confirm"**

### Step 1.4: Get Your Connection String

1. Go to **Deployment → Database**
2. Click **"Connect"** on your cluster
3. Choose **"Drivers"**
4. Copy the connection string, it looks like:
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your database user password
6. Add the database name before the `?`:
   ```
   mongodb+srv://username:yourpassword@cluster0.xxxxx.mongodb.net/restaurant?retryWrites=true&w=majority
   ```

✅ Save this as your `MONGODB_URI`

---

## 2. Stripe Setup

Stripe handles all payment processing.

### Step 2.1: Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in top-right)
3. Go to **Developers → API Keys**
4. Copy:
   - **Publishable key** (starts with `pk_test_`) → `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (starts with `sk_test_`) → `STRIPE_SECRET_KEY`

### Step 2.2: Create Webhook Endpoint

⚠️ **Do this AFTER your first Vercel deployment** (you need the URL first)

1. Go to **Developers → Webhooks**
2. Click **"Add endpoint"**
3. Enter your endpoint URL:
   ```
   https://your-app-name.vercel.app/api/stripe-webhook
   ```
4. Under "Select events to listen to", click **"Select events"**
5. Search and select: `checkout.session.completed`
6. Click **"Add endpoint"**
7. Click on your new endpoint, then **"Reveal"** the signing secret
8. Copy the signing secret (starts with `whsec_`) → `STRIPE_WEBHOOK_SECRET`

### Step 2.3: Going Live (Production)

When ready for real payments:

1. Complete Stripe account verification
2. Switch to **Live Mode** in the dashboard
3. Get new **live** API keys (start with `pk_live_` and `sk_live_`)
4. Create a new webhook endpoint for production
5. Update all environment variables in Vercel

---

## 3. Resend Email Setup (Optional)

Resend sends order confirmation emails to customers.

### Step 3.1: Create Account and API Key

1. Go to [Resend](https://resend.com) and sign up
2. Go to **API Keys** → **Create API Key**
3. Name it (e.g., "Restaurant App")
4. Copy the key (starts with `re_`) → `RESEND_API_KEY`

### Step 3.2: Verify Your Domain (For Production)

For testing, emails are sent from `onboarding@resend.dev` (only works for your own email).

For production with customers:

1. Go to **Domains** → **Add Domain**
2. Enter your domain (e.g., `yourtaqueria.com`)
3. Add the DNS records Resend provides:
   - Usually 3 TXT records + 1 MX record
4. Wait for verification (5-30 minutes)
5. Update the sender email in `api/send-order-email.ts`:
   ```typescript
   from: 'Orders <orders@yourdomain.com>',
   ```

---

## 4. Google OAuth Setup (Optional)

Allows customers to sign in with their Google account.

### Step 4.1: Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services → Credentials**
4. Click **"Create Credentials" → "OAuth client ID"**
5. If prompted, configure the consent screen first:
   - User Type: External
   - App name: Your restaurant name
   - Support email: Your email
   - Save and continue through all steps
6. Back in Credentials, create OAuth client ID:
   - Application type: **Web application**
   - Name: "Restaurant Web App"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for local dev)
     - `https://your-app-name.vercel.app` (your Vercel URL)
   - Click **Create**
7. Copy the **Client ID** → `VITE_GOOGLE_CLIENT_ID`

---

## 5. Environment Variables Summary

Here's every environment variable you need:

| Variable | Example Value | Required |
|----------|---------------|----------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/restaurant?retryWrites=true&w=majority` | ✅ Yes |
| `STRIPE_SECRET_KEY` | `sk_test_51ABC...` | ✅ Yes |
| `STRIPE_WEBHOOK_SECRET` | `whsec_ABC123...` | ✅ Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_51ABC...` | ✅ Yes |
| `JWT_SECRET` | `your-super-secret-random-string-32-chars-minimum` | ✅ Yes |
| `ADMIN_PASSWORD_HASH` | `$2a$10$...` (bcrypt hash) | ✅ Yes |
| `CHEF_PASSWORD_HASH` | `$2a$10$...` (bcrypt hash) | ✅ Yes |
| `VITE_APP_URL` | `https://your-app-name.vercel.app` | ✅ Yes |
| `RESEND_API_KEY` | `re_ABC123...` | Optional |
| `VITE_GOOGLE_CLIENT_ID` | `123456789.apps.googleusercontent.com` | Optional |

### Generate JWT_SECRET

Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generate ADMIN_PASSWORD_HASH

Run this (replace `your-admin-password` with your desired password):
```bash
node -e "console.log(require('bcryptjs').hashSync('your-admin-password', 10))"
```

### Generate CHEF_PASSWORD_HASH

Run this (replace `your-chef-password` with your desired password):
```bash
node -e "console.log(require('bcryptjs').hashSync('your-chef-password', 10))"
```

---

## 6. Vercel Deployment

### Step 6.1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

### Step 6.2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click **"Add New..." → "Project"**
3. Import your GitHub repository
4. Vercel auto-detects Vite configuration
5. **Before deploying**, expand **"Environment Variables"**
6. Add ALL required environment variables from the table above
   - For `VITE_APP_URL`, use a placeholder first (e.g., `https://placeholder.vercel.app`)
7. Click **"Deploy"**

### Step 6.3: Update URLs After Deployment

1. Once deployed, copy your actual Vercel URL (e.g., `https://your-app-name.vercel.app`)
2. Go to **Settings → Environment Variables**
3. Update `VITE_APP_URL` to your actual URL
4. Redeploy: Go to **Deployments** → click "..." on latest → **"Redeploy"**

---

## 7. Post-Deployment Configuration

### 7.1: Set Up Stripe Webhook

Now that you have your Vercel URL:

1. Go to Stripe Dashboard → **Developers → Webhooks**
2. Add endpoint: `https://your-app-name.vercel.app/api/stripe-webhook`
3. Select event: `checkout.session.completed`
4. Copy the signing secret
5. Add `STRIPE_WEBHOOK_SECRET` to Vercel environment variables
6. Redeploy

### 7.2: Update Google OAuth Origins

If using Google Sign-In:

1. Go to Google Cloud Console → **APIs & Services → Credentials**
2. Edit your OAuth client
3. Add your Vercel URL to **Authorized JavaScript origins**

### 7.3: Custom Domain (Optional)

1. In Vercel, go to **Settings → Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `VITE_APP_URL` to your custom domain
5. Update Stripe webhook URL
6. Update Google OAuth origins

---

## 8. Testing Your Deployment

### Test Checklist

- [ ] **Homepage loads** - Visit your Vercel URL
- [ ] **Menu displays** - Navigate to /menu
- [ ] **Add to cart works** - Add items and check cart
- [ ] **Checkout flow** - Use Stripe test card: `4242 4242 4242 4242`
- [ ] **Order success page** - Verify redirect after payment
- [ ] **Order confirmation email** - Check your inbox (if Resend configured)
- [ ] **Admin dashboard** - Go to /admin and log in
- [ ] **Order history** - Check /orders shows your test order

### Stripe Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |

Use any future expiry date (e.g., 12/34) and any 3-digit CVC.

---

## 9. Troubleshooting

### "Payment API not available" / Test Mode Activates

- Verify `STRIPE_SECRET_KEY` is set correctly in Vercel
- Check Vercel function logs for errors
- Ensure you're using the correct API key format

### Orders Not Appearing in Admin

- Check MongoDB connection string is correct
- Verify database name is `restaurant` in the connection string
- Check Vercel function logs for MongoDB errors

### Emails Not Sending

- Verify `RESEND_API_KEY` is set
- For testing, emails only work to the account owner's email
- For production, verify your domain in Resend

### Webhook Errors

- Verify webhook URL matches your Vercel deployment exactly
- Check `STRIPE_WEBHOOK_SECRET` matches the endpoint
- View webhook logs in Stripe Dashboard → Developers → Webhooks

### Google Sign-In Not Working

- Ensure `VITE_GOOGLE_CLIENT_ID` is set
- Verify your Vercel URL is in authorized origins
- Check browser console for specific errors

### Viewing Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Logs"** tab
3. Filter by function name (e.g., `api/stripe-webhook`)

---

## Quick Reference

| Service | Dashboard URL |
|---------|---------------|
| Vercel | https://vercel.com/dashboard |
| MongoDB Atlas | https://cloud.mongodb.com |
| Stripe | https://dashboard.stripe.com |
| Resend | https://resend.com |
| Google Cloud | https://console.cloud.google.com |

---

## 10. Alternative Hosting Options

If you exceed Vercel's free tier limits or prefer other platforms:

### Railway.app

**Pros**: Simple deployment, generous free tier, good for full-stack apps

1. Go to [Railway](https://railway.app) and connect GitHub
2. Create new project → Deploy from GitHub repo
3. Add environment variables in Railway dashboard
4. Railway auto-detects the build configuration
5. Webhook URL: `https://your-app.railway.app/api/stripe-webhook`

**Free tier**: $5/month credit, ~500 hours of runtime

### Render.com

**Pros**: Free static hosting, auto-deploys from GitHub

1. Go to [Render](https://render.com) and connect GitHub
2. Create **Web Service** for the full app
3. Build command: `npm run build`
4. Start command: `npm run preview`
5. Add all environment variables
6. Webhook URL: `https://your-app.onrender.com/api/stripe-webhook`

**Free tier**: 750 hours/month for web services

### Fly.io

**Pros**: Edge deployment, good performance, Docker-based

1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Set secrets: `fly secrets set MONGODB_URI="..." STRIPE_SECRET_KEY="..."`
5. Deploy: `fly deploy`

**Free tier**: 3 shared-cpu VMs, 160GB bandwidth

### Netlify

**Pros**: Excellent for static sites with serverless functions

1. Go to [Netlify](https://netlify.com) and connect GitHub
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Move `api/` to `netlify/functions/` (requires code changes)
5. Add environment variables

**Note**: Netlify uses a different serverless function format - requires adapting API routes.

**Free tier**: 125K function invocations/month

---

## 11. Monitoring & Analytics

### Vercel Analytics (Built-in)

1. Go to your project in Vercel
2. Click **Analytics** tab
3. Enable Web Analytics (free for basic usage)
4. Tracks page views, performance metrics

### Monitoring Function Usage

1. Vercel Dashboard → Your Project → **Usage**
2. Check "Serverless Function Execution"
3. Set up **Spend Notifications** in Vercel Settings → Billing

### External Monitoring (Optional)

**Uptime monitoring** (free tiers available):
- [UptimeRobot](https://uptimerobot.com) - 50 free monitors
- [Freshping](https://freshping.io) - 50 free checks
- [Betterstack](https://betterstack.com) - Free tier available

**Error tracking**:
- [Sentry](https://sentry.io) - 5K errors/month free
- Add to your app with: `npm install @sentry/react`

### Setting Up Basic Health Monitoring

Monitor your app by pinging these endpoints:

| Endpoint | What it checks |
|----------|----------------|
| `https://your-app.vercel.app/` | Frontend is loading |
| `https://your-app.vercel.app/api/orders` | API is responding (returns 401, but confirms API works) |

---

## 12. Cost Estimation

### Vercel Free Tier Limits

| Resource | Free Limit | Typical Usage (1K orders/month) |
|----------|------------|--------------------------------|
| Bandwidth | 100 GB | ~2-5 GB |
| Serverless Invocations | 100,000 | ~3,000-5,000 |
| Serverless Execution | 100 GB-hours | ~1-2 GB-hours |
| Build Minutes | 6,000 min/month | ~50-100 min |

### When to Upgrade

Consider upgrading when you:
- Exceed 100K function invocations/month (~20K+ orders)
- Need custom domains with SSL on multiple projects
- Want team collaboration features
- Need longer function execution times (>10s)

### Cost-Saving Tips

1. **Enable caching** for static assets
2. **Optimize images** before uploading
3. **Minimize API calls** from frontend
4. **Use client-side validation** before API calls

---

## 13. Security Best Practices

### Environment Variables

- ✅ Never commit `.env` to git
- ✅ Use different API keys for test vs production
- ✅ Rotate secrets periodically
- ✅ Use strong, unique JWT_SECRET (32+ characters)

### Database Security

- ✅ MongoDB Atlas IP whitelist (0.0.0.0/0 for serverless, tighten for dedicated servers)
- ✅ Use separate database users for different apps
- ✅ Enable MongoDB audit logging for production

### Stripe Security

- ✅ Always verify webhook signatures
- ✅ Use test mode for development
- ✅ Never log full card details
- ✅ Enable Stripe Radar for fraud protection

### Admin Access

- ✅ Use strong admin password (12+ characters, mixed case, numbers, symbols)
- ✅ Consider IP restrictions for admin routes in production
- ✅ Log admin actions for audit trail

---

## Need Help?

- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Stripe Documentation](https://stripe.com/docs)
- Check [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- Check [Railway Documentation](https://docs.railway.app)
- Check [Render Documentation](https://render.com/docs)

Good luck with your deployment! 🌮🚀
