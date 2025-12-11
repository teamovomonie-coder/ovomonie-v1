/**
 * Seed a test user in Firestore for local login.
 * Run with: `npx tsx src/scripts/seed-test-user.ts`
 */
import { db } from "@/lib/firebase";
import { hashSecret } from "@/lib/auth";

import "dotenv/config";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";

async function main() {
  const phone = "+2349034151086";
  const loginPin = "123456";

  const usersRef = collection(db, "users");
  const docRef = await addDoc(usersRef, {
    phone,
    fullName: "Test User",
    email: "test1@example.com",
    accountNumber: "1234567890",
    balance: 0,
    kycTier: 1,
    isAgent: false,
    loginPinHash: hashSecret(loginPin),
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log(`Seeded test user ${phone} (PIN: ${loginPin}) with id ${docRef.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
