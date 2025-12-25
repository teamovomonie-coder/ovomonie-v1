# Development Checklist - Supabase Setup Verification

## ✅ Environment Setup

- [ ] Node.js 20+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` configured with Supabase credentials
- [ ] `AUTH_SECRET` set to a strong random string
- [ ] Supabase project created and accessible

## ✅ Database Setup

- [ ] Supabase database migrations executed
- [ ] All tables created successfully
- [ ] Indexes and triggers in place
- [ ] Database functions working (test with SQL editor)

## ✅ Authentication System

- [ ] User registration working (`/register`)
- [ ] User login working (`/login`)
- [ ] JWT token generation and validation
- [ ] Protected routes redirecting properly
- [ ] Logout functionality working

## ✅ Core Financial Features

- [ ] User dashboard loading with balance
- [ ] Internal transfers working
- [ ] Transaction history displaying
- [ ] Balance updates in real-time
- [ ] Notifications system working

## ✅ API Endpoints

Test these key endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# User authentication (after login)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/auth/me

# Wallet balance
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/wallet/balance

# Transaction history
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/transactions
```

## ✅ VFD Integration (Optional)

- [ ] VFD API credentials configured
- [ ] Token generation working
- [ ] Card funding API accessible
- [ ] Bill payment services working

## ✅ UI/UX Components

- [ ] Responsive design on mobile/desktop
- [ ] Loading states working
- [ ] Error handling displaying properly
- [ ] Toast notifications appearing
- [ ] Navigation working smoothly

## ✅ Security Features

- [ ] Rate limiting active on auth endpoints
- [ ] PIN validation working
- [ ] Account lockout after failed attempts
- [ ] Sensitive data properly hashed
- [ ] HTTPS enforced in production

## 🧪 Quick Test Scenarios

### 1. User Registration Flow
1. Go to `/register`
2. Enter phone number and PIN
3. Complete registration
4. Verify user created in Supabase
5. Check welcome notification

### 2. Login and Dashboard
1. Go to `/login`
2. Enter credentials
3. Verify redirect to `/dashboard`
4. Check balance display
5. Verify user data loaded

### 3. Internal Transfer
1. Go to `/internal-transfer`
2. Enter recipient account number
3. Enter amount and PIN
4. Complete transfer
5. Verify balance updated
6. Check transaction history
7. Verify notifications sent

### 4. Bill Payment
1. Go to `/bill-payment`
2. Select service provider
3. Enter details and amount
4. Complete payment
5. Verify transaction recorded

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm run test

# Test VFD connectivity (if configured)
npm run test:vfd

# Seed test data
npm run db:seed
```

## 🐛 Common Issues & Solutions

### Issue: Supabase Connection Failed
**Solution**: 
- Check environment variables
- Verify Supabase URL and keys
- Ensure service role key has proper permissions

### Issue: Authentication Not Working
**Solution**:
- Clear browser localStorage
- Check AUTH_SECRET is set
- Verify JWT token format

### Issue: Database Queries Failing
**Solution**:
- Check RLS policies in Supabase
- Verify table permissions
- Test queries in Supabase SQL editor

### Issue: Balance Not Updating
**Solution**:
- Check transaction triggers
- Verify balance calculation logic
- Test with manual SQL updates

## 📊 Monitoring Setup

### Supabase Dashboard
- Monitor API usage
- Check database performance
- Review error logs
- Monitor authentication metrics

### Application Logs
- Check browser console for errors
- Monitor API response times
- Review transaction success rates
- Track user engagement metrics

## 🚀 Production Readiness

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] Rate limiting properly configured
- [ ] Error monitoring setup
- [ ] Backup strategy in place
- [ ] Performance testing completed
- [ ] Security audit completed

## 📝 Notes

- Keep this checklist updated as new features are added
- Document any custom configurations or workarounds
- Share this checklist with new team members
- Use this for deployment verification

---

**Last Updated**: January 2025  
**Use this checklist**: Every time you set up a new development environment