const fs=require('fs');
// Patch vfd-card-payment: remove handlePaymentSuccess from deps
const p='src/components/add-money/vfd-card-payment.tsx';
let s=fs.readFileSync(p,'utf8');
if(s.includes('}, [cardData, toast, handlePaymentSuccess]);')){
  s = s.replace('}, [cardData, toast, handlePaymentSuccess]);','}, [cardData, toast]);');
  fs.writeFileSync(p,s);
  console.log('patched',p);
} else console.log('no change for',p);

// Patch auth-context: add displayAccountNumber to ClientUser type
const q='src/context/auth-context.tsx';
let t=fs.readFileSync(q,'utf8');
if(t.includes('> & { userId: string; photoUrl?: string | null };')){
  t = t.replace('> & { userId: string; photoUrl?: string | null };', "> & { userId: string; photoUrl?: string | null; displayAccountNumber?: string };" );
  fs.writeFileSync(q,t);
  console.log('patched',q);
} else console.log('no change for',q);
