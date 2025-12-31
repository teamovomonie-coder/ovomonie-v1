// Test script to verify unique reference generation
const generateTransactionReference = (type) => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${type.toUpperCase()}-${timestamp}-${randomSuffix}`;
};

// Generate 10 airtime references to test uniqueness
console.log('Testing unique airtime transaction references:');
const references = new Set();

for (let i = 0; i < 10; i++) {
  const ref = generateTransactionReference('airtime');
  console.log(`${i + 1}: ${ref}`);
  
  if (references.has(ref)) {
    console.error('DUPLICATE FOUND!', ref);
  } else {
    references.add(ref);
  }
  
  // Small delay to ensure timestamp difference
  await new Promise(resolve => setTimeout(resolve, 1));
}

console.log(`\nGenerated ${references.size} unique references out of 10 attempts`);
console.log('All references are unique:', references.size === 10);