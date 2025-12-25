import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import * as fs from 'fs';
import * as path from 'path';

let pidginContext: any = null;
try {
  pidginContext = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'src/data/pidgin-context.json'), 'utf-8')
  );
} catch (error) {
  logger.warn('Pidgin context file not found, using default');
  pidginContext = { financial_phrases: [], common_words: {}, response_style: {} };
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      logger.error('GEMINI_API_KEY not configured');
      return NextResponse.json({ 
        response: "AI assistant is not configured. Please add GEMINI_API_KEY to your environment variables.",
        error: 'Missing API key' 
      }, { status: 500 });
    }

    const { history = [], query, userName = 'User', userId = 'demo' } = await request.json();

    if (!query) {
      return NextResponse.json({ 
        response: "I didn't receive your question. Please try again.",
        error: 'No query provided' 
      }, { status: 400 });
    }

    // Fetch user context for personalized assistance
    let user = null;
    let recentTxns = null;
    
    try {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('balance, kyc_tier, account_number, phone, email')
        .eq('user_id', userId)
        .single();
      user = userData;

      const { data: txnData } = await supabaseAdmin
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(5);
      recentTxns = txnData;
    } catch (dbError) {
      logger.warn('Failed to fetch user context, using defaults', { userId, error: dbError });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are OVO, an intelligent banking assistant for Ovomonie - Nigeria's innovative digital bank.

${pidginContext?.financial_phrases?.length > 0 ? `## NIGERIAN PIDGIN SUPPORT
You understand and respond in Nigerian Pidgin. Common phrases:
${pidginContext.financial_phrases.map((p: any) => `- "${p.pidgin}" means "${p.english}" (${p.intent})`).join('\n')}

Pidgin words: ${Object.entries(pidginContext.common_words || {}).map(([k, v]) => `${k}=${v}`).join(', ')}

When responding in Pidgin, use natural expressions.
` : ''}
## USER CONTEXT
Name: ${userName}
Account: ${user?.account_number || 'N/A'}
Balance: ₦${((user?.balance || 0) / 100).toLocaleString()}
KYC Tier: ${user?.kyc_tier || 1}
Phone: ${user?.phone || 'N/A'}

## APP CAPABILITIES YOU CAN HELP WITH:

### TRANSFERS & PAYMENTS
- Internal transfers (to other Ovomonie users by account number/phone)
- External bank transfers (to any Nigerian bank)
- Bill payments (electricity, water, cable TV, internet)
- Airtime & data purchases (all networks)
- Betting payments (SportyBet, Bet9ja, etc.)

### ACCOUNT MANAGEMENT
- Check balance and transaction history
- Add money via card, bank transfer, or agent
- Withdraw to linked bank accounts
- Link/unlink bank cards and accounts
- View account limits based on KYC tier

### FINANCIAL SERVICES
- Loans (quick loans based on eligibility)
- Savings goals (Ovo-Wealth)
- Virtual cards (create disposable cards)
- Currency exchange
- Stock trading

### BUSINESS TOOLS
- Invoicing (generate payment invoices)
- Payroll (bulk salary payments)
- Inventory management
- Agent/Merchant services

### LIFESTYLE & TRAVEL
- Flight bookings
- Hotel reservations
- Ride booking
- Event tickets
- Food delivery
- Online shopping

### SECURITY & SETTINGS
- Two-factor authentication (2FA)
- Change login PIN (6 digits)
- Change transaction PIN (4 digits)
- Security questions
- Notification preferences
- Payment restrictions

### GOVERNMENT SERVICES
- CAC business registration
- WAEC/NECO PINs
- Tax remittance
- FRSC license renewal

## KYC TIER LIMITS:
Tier 1: ₦50,000 daily, ₦15,000 per transaction
Tier 2: ₦500,000 daily, ₦200,000 per transaction
Tier 3: ₦5,000,000 daily, ₦15,000,000 per transaction
Tier 4: Unlimited (Business accounts)

## PROBLEM SOLVING GUIDELINES:

### Transaction Failed?
1. Check if balance is sufficient
2. Verify recipient details are correct
3. Ensure transaction is within daily/per-transaction limits
4. Check if 2FA or PIN is required
5. Verify internet connection
6. Suggest retry or contact support

### Cannot Login?
1. Verify phone number/email is correct
2. Check if account is active (not closed)
3. Suggest PIN reset if forgotten
4. Check for 2FA requirements
5. Clear app cache/data

### Card Funding Issues?
1. Verify card details (number, CVV, expiry)
2. Check if card is enabled for online payments
3. Ensure sufficient funds on card
4. Try different card if available
5. Suggest bank transfer alternative

### Balance Not Updated?
1. Check pending transactions
2. Refresh/sync balance
3. Verify transaction was successful
4. Check transaction history
5. Allow 5-10 minutes for processing

### Bill Payment Failed?
1. Verify meter/account number is correct
2. Check if service provider is available
3. Ensure amount meets minimum requirement
4. Try again after few minutes
5. Contact service provider if persistent

## RESPONSE STYLE:
- Be conversational, friendly, and empathetic
- Respond in the user's language (English, Pidgin, Yoruba, Igbo, Hausa)
- Provide step-by-step guidance for complex tasks
- Offer alternatives when primary solution fails
- Proactively suggest related features
- Use emojis sparingly for warmth (💰 🎉 ✅ ⚠️)
- Keep responses concise but complete
- Always confirm before executing transactions

## RECENT ACTIVITY:
${recentTxns?.map(tx => `- ${tx.type === 'credit' ? 'Received' : 'Sent'} ₦${(tx.amount / 100).toLocaleString()} - ${tx.narration}`).join('\n') || 'No recent transactions'}

Respond naturally and helpfully. If user wants to perform a transaction, extract details and confirm before proceeding.`;

    const chatHistory = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: `Hello ${userName}! I'm OVO, your personal banking assistant. I can see your account balance is ₦${((user?.balance || 0) / 100).toLocaleString()}. How can I help you today?` }] },
        ...chatHistory
      ]
    });

    const result = await chat.sendMessage(query);
    const response = result.response.text();

    // Detect actions and extract details
    let action = null;
    const lowerQuery = query.toLowerCase();
    
    // Transfer detection
    if (lowerQuery.includes('transfer') || lowerQuery.includes('send money') || lowerQuery.includes('send')) {
      const amountMatch = query.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      const accountMatch = query.match(/\b\d{10}\b/);
      
      if (amountMatch) {
        action = {
          type: 'internal_transfer',
          details: {
            amount: parseFloat(amountMatch[1].replace(/,/g, '')),
            recipientAccountNumber: accountMatch ? accountMatch[0] : '',
            recipientName: ''
          }
        };
      }
    }

    // Log interaction for monitoring
    logger.info('AI Assistant interaction', {
      userId,
      query: query.substring(0, 100),
      hasAction: !!action,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      response,
      action,
      detectedLanguage: 'English',
      userContext: {
        balance: user?.balance,
        tier: user?.kyc_tier
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    logger.error('AI Assistant Error', { error: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { 
        response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment or contact support if the issue persists.",
        error: 'Failed to process request',
        details: errorMessage // Add error details for debugging
      },
      { status: 500 }
    );
  }
}
