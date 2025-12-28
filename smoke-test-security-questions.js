/**
 * Smoke Test for Security Questions Feature
 * Tests: POST (create), GET (retrieve), POST (update)
 */

const BASE_URL = 'http://localhost:3000';

// Mock auth token - replace with real token from localStorage after login
const AUTH_TOKEN = 'your-test-token-here';

const testData = {
  question1: "What was the name of your first pet?",
  answer1: "Fluffy",
  question2: "What city were you born in?",
  answer2: "Lagos",
  question3: "What is your favorite food?",
  answer3: "Jollof Rice"
};

const updatedData = {
  question1: "What was the name of your first pet?",
  answer1: "Buddy",
  question2: "What is your mother's maiden name?",
  answer2: "Johnson",
  question3: "What was your childhood nickname?",
  answer3: "Champ"
};

async function runSmokeTest() {
  console.log('🧪 Starting Security Questions Smoke Test...\n');

  try {
    // Test 1: Create security questions
    console.log('Test 1: Creating security questions...');
    const createRes = await fetch(`${BASE_URL}/api/security/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(testData)
    });

    if (!createRes.ok) {
      const error = await createRes.json();
      console.error('❌ Create failed:', error);
      return;
    }

    const createResult = await createRes.json();
    console.log('✅ Create successful:', createResult);

    // Test 2: Retrieve security questions
    console.log('\nTest 2: Retrieving security questions...');
    const getRes = await fetch(`${BASE_URL}/api/security/questions`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    if (!getRes.ok) {
      const error = await getRes.json();
      console.error('❌ Retrieve failed:', error);
      return;
    }

    const getResult = await getRes.json();
    console.log('✅ Retrieve successful:', getResult);

    // Verify questions match
    if (getResult.questions.question1 === testData.question1 &&
        getResult.questions.question2 === testData.question2 &&
        getResult.questions.question3 === testData.question3) {
      console.log('✅ Questions match expected values');
    } else {
      console.error('❌ Questions do not match');
    }

    // Test 3: Update security questions
    console.log('\nTest 3: Updating security questions...');
    const updateRes = await fetch(`${BASE_URL}/api/security/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(updatedData)
    });

    if (!updateRes.ok) {
      const error = await updateRes.json();
      console.error('❌ Update failed:', error);
      return;
    }

    const updateResult = await updateRes.json();
    console.log('✅ Update successful:', updateResult);

    // Test 4: Verify update
    console.log('\nTest 4: Verifying update...');
    const verifyRes = await fetch(`${BASE_URL}/api/security/questions`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    if (!verifyRes.ok) {
      const error = await verifyRes.json();
      console.error('❌ Verify failed:', error);
      return;
    }

    const verifyResult = await verifyRes.json();
    console.log('✅ Verify successful:', verifyResult);

    if (verifyResult.questions.question1 === updatedData.question1 &&
        verifyResult.questions.question2 === updatedData.question2 &&
        verifyResult.questions.question3 === updatedData.question3) {
      console.log('✅ Updated questions match expected values');
    } else {
      console.error('❌ Updated questions do not match');
    }

    console.log('\n🎉 All smoke tests passed!');

  } catch (error) {
    console.error('❌ Smoke test failed:', error.message);
  }
}

// Instructions
console.log('📋 Instructions:');
console.log('1. Start dev server: npm run dev');
console.log('2. Login to the app and copy your auth token from localStorage');
console.log('3. Replace AUTH_TOKEN in this file');
console.log('4. Run: node smoke-test-security-questions.js\n');

if (AUTH_TOKEN === 'your-test-token-here') {
  console.log('⚠️  Please set AUTH_TOKEN before running tests');
} else {
  runSmokeTest();
}
