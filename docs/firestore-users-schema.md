# Firestore `users` collection (recommendation)

Lean schema tailored to current app flows (phone+PIN auth, KYC tiers, agent mode, balances in kobo).

## Document ID
- `users/{userId}` — use as auth token subject. Keep `phone` unique.

## Fields
- `phone` (string, required) — E.164 preferred; unique.
- `fullName` (string, required)
- `email` (string, optional)
- `accountNumber` (string, required) — wallet/virtual account id.
- `balance` (number, required) — stored in kobo (int).
- `kycTier` (number) — 1, 2, or 3.
- `isAgent` (boolean)
- `loginPinHash` (string) — scrypt hash; do not store plaintext PIN.
- `lastLogoutAll` (Timestamp) — bump to invalidate all tokens.
- `status` (string) — e.g., `active`, `locked`, `pending`.
- `createdAt`, `updatedAt` (Timestamp)
- `bvn`, `nin` (string, optional) — store hashed/partial per compliance policy.
- `address` (map, optional) — `{ line1, line2, city, state, country }`
- `limits` (map, optional) — `{ daily: number, monthly: number }` in kobo.

### Agent details (when `isAgent` true)
- `agent` (map) — `{ businessName, businessAddress, posSerialNumber, region, settlementAccount: { bankCode, accountNumber, accountName } }`

### Security/risk (optional but useful)
- `lastLoginAt` (Timestamp)
- `failedLoginCount` (number)

## Indexing
- Single-field index on `phone` (login lookup).
- Single-field on `status` if filtering by active/locked.
- Composite on `isAgent` + `region` if listing agents by region.

## Behavior notes
- Money is kobo; divide by 100 in UI only.
- Hash PINs (`loginPinHash`) and drop legacy `loginPin`.
- Use `lastLogoutAll` to force token invalidation.
- Keep immutable transaction history in a separate `transactions`/`ledger` collection; do not rely on `balance` alone for audit.
