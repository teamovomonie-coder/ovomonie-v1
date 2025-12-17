# Testing Receipt Templates

## ⚠️ Important: Which Payment Type Are You Testing?

### Bill Payment (✅ Has Receipt Templates)
- **Page**: `/bill-payment`
- **Endpoint**: `/api/bills/vfd`
- **Receipt**: Dynamic template-based receipts
- **Status**: ✅ Fully implemented

### Betting Payment (❌ No Receipt Templates Yet)
- **Page**: `/betting`
- **Endpoint**: `/api/payments`
- **Receipt**: Old static receipt
- **Status**: ❌ Not implemented
- **Error**: 400 Bad Request (check server logs for details)

## How to Test Bill Payment Receipts

1. **Navigate to Bill Payment**:
   - Go to `/bill-payment` page
   - NOT the betting page

2. **Select a Biller**:
   - Choose any utility provider (e.g., IKEDC)
   - Or Cable TV (e.g., DStv)

3. **Enter Details**:
   - Meter/Smart card number
   - Amount

4. **Complete Payment**:
   - Enter PIN
   - Payment processes

5. **See Receipt**:
   - Modal shows immediately with category-specific styling
   - Utility = Orange with ⚡
   - Cable TV = Purple with 📺
   - Internet = Cyan with 📶

## Debugging Betting Payment Error

The 400 error is from betting payment. Check:

1. **Browser Console**:
   - Look for `[Betting] Payment payload:`
   - Verify all fields present

2. **Server Logs**:
   - Look for `[Payments API] Request body:`
   - Check which field is missing/invalid

3. **Common Issues**:
   - `amount` must be a number
   - `party` must be an object with `name`
   - `clientReference` must be present
   - `category` must be present

## Quick Fix: Test Bill Payment Instead

Since bill payment receipts are fully working, test those:

```
1. Go to: http://localhost:3000/bill-payment
2. Select: IKEDC (or any utility)
3. Enter: Any meter number
4. Amount: 1000
5. Click: Pay Bill
6. Enter: PIN
7. See: Orange receipt with ⚡ icon
```

## If You Must Test Betting

The betting payment needs the receipt template system added. For now:
- Check server logs for exact error
- Verify payload in browser console
- Or wait for betting receipt templates to be implemented
