/**
 * BVN Verification API
 * Verifies Bank Verification Number and retrieves user details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { userService } from '@/lib/db';
import { logger } from '@/lib/logger';

// Mock BVN database for testing
const MOCK_BVNS = {
  '12345678901': {
    verified: true,
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Smith',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    phone: '08012345678',
    photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
  },
  '11111111111': {
    verified: true,
    firstName: 'Jane',
    lastName: 'Smith',
    middleName: 'Mary',
    dateOfBirth: '1985-05-15',
    gender: 'Female',
    phone: '08087654321',
    photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
  }
};

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers) || 'dev-user-fallback';

    const { bvn, dateOfBirth } = await req.json();

    if (!bvn || bvn.length !== 11) {
      return NextResponse.json(
        { ok: false, message: 'Valid 11-digit BVN is required' },
        { status: 400 }
      );
    }

    if (!dateOfBirth) {
      return NextResponse.json(
        { ok: false, message: 'Date of birth is required' },
        { status: 400 }
      );
    }

    const user = await userService.getById(userId);
    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    // Check mock BVN first
    if (MOCK_BVNS[bvn as keyof typeof MOCK_BVNS]) {
      const mockData = MOCK_BVNS[bvn as keyof typeof MOCK_BVNS];
      
      // Verify DOB matches (normalize date format)
      const normalizedInputDOB = new Date(dateOfBirth).toISOString().split('T')[0];
      const normalizedMockDOB = new Date(mockData.dateOfBirth).toISOString().split('T')[0];
      
      if (normalizedMockDOB !== normalizedInputDOB) {
        return NextResponse.json({
          ok: false,
          message: `Date of birth does not match BVN records. Expected: ${normalizedMockDOB}, Got: ${normalizedInputDOB}`
        }, { status: 400 });
      }
      
      logger.info('Mock BVN verification successful', { userId, bvn });
      
      return NextResponse.json({
        ok: true,
        data: {
          ...mockData,
          bvn: bvn,
          message: 'BVN verified successfully'
        },
      });
    }

    // Use VFD BVN Enquiry for real verification
    try {
      const bvnData = await vfdWalletService.enquireBVN({ bvn });
      
      // Verify DOB matches (normalize date format)
      const normalizedInputDOB = new Date(dateOfBirth).toISOString().split('T')[0];
      const normalizedBvnDOB = new Date(bvnData.dateOfBirth).toISOString().split('T')[0];
      
      if (normalizedBvnDOB !== normalizedInputDOB) {
        return NextResponse.json({
          ok: false,
          message: `Date of birth does not match BVN records. Expected: ${normalizedBvnDOB}, Got: ${normalizedInputDOB}`
        }, { status: 400 });
      }

      logger.info('VFD BVN verification successful', { userId, bvn });
      
      return NextResponse.json({
        ok: true,
        data: {
          ...bvnData,
          message: 'BVN verified successfully'
        },
      });

    } catch (error) {
      logger.warn('VFD BVN enquiry failed, trying fallback verification', { error: error instanceof Error ? error.message : 'Unknown error', userId, bvn });
      
      // Fallback to existing BVN verification
      try {
        const bvnResult = await vfdWalletService.verifyBVN({
          accountNumber: user.account_number || 'DEV-ACCOUNT',
          bvn,
        });

        if (!bvnResult.verified) {
          return NextResponse.json({ 
            ok: false, 
            message: 'BVN verification failed. Please check your BVN and try again.' 
          }, { status: 400 });
        }

        // Verify DOB matches (normalize date format)
        const normalizedInputDOB = new Date(dateOfBirth).toISOString().split('T')[0];
        const normalizedResultDOB = new Date(bvnResult.dateOfBirth).toISOString().split('T')[0];
        
        if (normalizedResultDOB !== normalizedInputDOB) {
          return NextResponse.json({
            ok: false,
            message: `Date of birth does not match BVN records. Expected: ${normalizedResultDOB}, Got: ${normalizedInputDOB}`
          }, { status: 400 });
        }

        return NextResponse.json({
          ok: true,
          data: {
            verified: bvnResult.verified,
            firstName: bvnResult.firstName,
            lastName: bvnResult.lastName,
            middleName: bvnResult.middleName,
            dateOfBirth: bvnResult.dateOfBirth,
            phone: bvnResult.phone,
            bvn: bvnResult.bvn,
            photo: bvnResult.photo,
            message: 'BVN verified successfully'
          },
        });

      } catch (fallbackError) {
        logger.warn('All BVN verification methods failed', { error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error', userId, bvn });
        return NextResponse.json({ 
          ok: false, 
          message: 'BVN verification failed. Please use a valid BVN (Test: 12345678901 or 11111111111)' 
        }, { status: 400 });
      }
    }
  } catch (error: any) {
    logger.error('BVN verification error', { error: error.message });
    return NextResponse.json(
      { ok: false, message: error.message || 'BVN verification failed' },
      { status: 500 }
    );
  }
}