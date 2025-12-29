# Tier 2 KYC Upgrade Integration

This document outlines the complete integration of VFD API for BVN verification, image match verification, and Supabase OTP verification for Tier 2 account upgrades.

## Overview

The Tier 2 upgrade process now includes:
1. **BVN Verification** - Validates the user's Bank Verification Number using VFD API
2. **Live Selfie Capture** - Captures user's live photo for identity verification
3. **Image Match Verification** - Compares the selfie with BVN photo using VFD API
4. **Phone Number OTP Verification** - Verifies phone number using Supabase-stored OTP

## Architecture

### Frontend Flow (Step-by-Step)
1. User enters BVN → API verifies with VFD → Shows BVN details
2. User captures live selfie → Stores image locally
3. User requests OTP → API sends OTP via SMS service
4. User enters OTP → API validates and completes upgrade

### Backend Integration

#### VFD API Integration
- **BVN Verification**: `vfdWalletService.verifyBVN()`
- **Image Match**: `vfdWalletService.verifyImageMatch()`
- **Base URL**: `VFD_WALLET_API_BASE` environment variable

#### Database Schema
```sql
-- OTP Verifications Table
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  phone VARCHAR(20),
  otp_code VARCHAR(6),
  expires_at TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Additional User Columns
ALTER TABLE users ADD COLUMN bvn_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN selfie_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN selfie_match_score INTEGER DEFAULT 0;
```

## API Endpoints

### 1. BVN Verification
**POST** `/api/kyc/bvn`
```json
{
  "bvn": "12345678901"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "verified": true,
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "phone": "08012345678",
    "photo": "base64_encoded_photo"
  }
}
```

### 2. Send OTP
**POST** `/api/kyc/send-otp`
```json
{}
```

**Response:**
```json
{
  "ok": true,
  "message": "OTP sent to your phone",
  "data": {
    "phone": "080****5678"
  }
}
```

### 3. Image Match Verification
**POST** `/api/kyc/image-match`
```json
{
  "selfieImage": "data:image/jpeg;base64,...",
  "bvnPhoto": "base64_encoded_bvn_photo"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Face verification successful",
  "data": {
    "isMatch": true,
    "matchScore": 85,
    "confidence": 85
  }
}
```

### 4. Complete Upgrade
**POST** `/api/kyc/upgrade`
```json
{
  "tier": 2,
  "bvn": "12345678901",
  "selfie": "data:image/jpeg;base64,...",
  "otp": "123456"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Successfully upgraded to Tier 2!",
  "data": {
    "tier": 2,
    "limits": {
      "daily": 200000,
      "monthly": 1000000,
      "single": 50000
    }
  }
}
```

## Environment Variables

Add these to your `.env.local`:
```env
# VFD KYC API Base URLs
VFD_KYC_IMAGE_MATCH_API_BASE=https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2
VFD_WALLET_API_BASE=https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2

# VFD Authentication
VFD_ACCESS_TOKEN=your_vfd_access_token
VFD_CONSUMER_KEY=your_consumer_key
VFD_CONSUMER_SECRET=your_consumer_secret
```

## Security Features

1. **OTP Expiration**: OTPs expire after 10 minutes
2. **Image Match Threshold**: Minimum 70% confidence required
3. **Rate Limiting**: Built-in rate limiting for OTP requests
4. **Data Encryption**: Sensitive data is hashed before storage
5. **Row Level Security**: Supabase RLS policies protect user data

## Error Handling

The integration includes comprehensive error handling:
- VFD API failures fall back to development mode
- SMS failures are logged but don't block the process
- Database errors are properly caught and logged
- User-friendly error messages are returned

## Testing

Run the integration test:
```bash
node scripts/test-tier2-upgrade.js
```

## Migration Steps

1. Run database migrations:
```bash
# Apply OTP table migration
supabase db push

# Or manually run:
# 20250127000003_create_otp_verifications.sql
# 20250127000004_add_verification_columns.sql
```

2. Update environment variables with VFD credentials

3. Test the integration using the provided test script

## Production Considerations

1. **SMS Service**: Replace `MockSMSService` with actual SMS provider (Twilio, Termii, etc.)
2. **Image Storage**: Consider storing images in secure cloud storage
3. **Rate Limiting**: Implement proper rate limiting for production
4. **Monitoring**: Add monitoring for VFD API calls and success rates
5. **Backup**: Ensure database backups include new tables

## Troubleshooting

### Common Issues

1. **VFD API Timeout**: Check network connectivity and API credentials
2. **OTP Not Received**: Verify SMS service configuration
3. **Image Match Fails**: Ensure images are properly base64 encoded
4. **Database Errors**: Check Supabase connection and table permissions

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will log additional information including mock OTP codes for testing.

## Support

For issues with this integration:
1. Check the logs in `/api/kyc/*` endpoints
2. Verify VFD API credentials and connectivity
3. Test individual endpoints using the provided test script
4. Review Supabase database logs for any constraint violations