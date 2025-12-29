#!/usr/bin/env node

/**
 * Test script for Tier 2 KYC upgrade integration
 * Tests BVN verification, image match, and OTP verification
 */

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://localhost:3000' : 'http://localhost:3000';

async function testTier2Upgrade() {
  console.log('🧪 Testing Tier 2 KYC Upgrade Integration...\n');

  // Mock user token (replace with actual token in real test)
  const token = 'test-token';
  const testBVN = '12345678901';
  const testOTP = '123456';
  const testSelfie = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

  try {
    // Step 1: Test BVN Verification
    console.log('1️⃣ Testing BVN Verification...');
    const bvnResponse = await fetch(`${BASE_URL}/api/kyc/bvn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bvn: testBVN })
    });

    const bvnResult = await bvnResponse.json();
    console.log('BVN Response:', bvnResult);

    if (!bvnResult.ok) {
      console.log('❌ BVN verification failed (expected in test environment)');
    } else {
      console.log('✅ BVN verification successful');
    }

    // Step 2: Test OTP Sending
    console.log('\n2️⃣ Testing OTP Sending...');
    const otpSendResponse = await fetch(`${BASE_URL}/api/kyc/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const otpSendResult = await otpSendResponse.json();
    console.log('OTP Send Response:', otpSendResult);

    if (!otpSendResult.ok) {
      console.log('❌ OTP sending failed (expected in test environment)');
    } else {
      console.log('✅ OTP sending successful');
    }

    // Step 3: Test Image Match
    console.log('\n3️⃣ Testing Image Match...');
    const imageMatchResponse = await fetch(`${BASE_URL}/api/kyc/image-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        selfieImage: testSelfie,
        bvnPhoto: testSelfie
      })
    });

    const imageMatchResult = await imageMatchResponse.json();
    console.log('Image Match Response:', imageMatchResult);

    if (!imageMatchResult.ok) {
      console.log('❌ Image match failed (expected in test environment)');
    } else {
      console.log('✅ Image match successful');
    }

    // Step 4: Test Complete Upgrade
    console.log('\n4️⃣ Testing Complete Tier 2 Upgrade...');
    const upgradeResponse = await fetch(`${BASE_URL}/api/kyc/upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tier: 2,
        bvn: testBVN,
        selfie: testSelfie,
        otp: testOTP
      })
    });

    const upgradeResult = await upgradeResponse.json();
    console.log('Upgrade Response:', upgradeResult);

    if (!upgradeResult.ok) {
      console.log('❌ Tier 2 upgrade failed (expected in test environment)');
    } else {
      console.log('✅ Tier 2 upgrade successful');
    }

    console.log('\n🎉 Integration test completed!');
    console.log('\n📝 Summary:');
    console.log('- BVN verification endpoint: /api/kyc/bvn');
    console.log('- OTP sending endpoint: /api/kyc/send-otp');
    console.log('- Image match endpoint: /api/kyc/image-match');
    console.log('- Upgrade endpoint: /api/kyc/upgrade');
    console.log('- Database tables: otp_verifications, users (with new columns)');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTier2Upgrade();