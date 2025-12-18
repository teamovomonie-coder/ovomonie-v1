const fs=require('fs');
const p='src/context/auth-context.tsx';
let s=fs.readFileSync(p,'utf8');
const old='> & { userId: string; photoUrl?: string | null };';
const neu='> & { userId: string; photoUrl?: string | null; displayAccountNumber?: string };';
if(s.includes(old)){
  s=s.replace(old,neu);
  fs.writeFileSync(p,s,'utf8');
  console.log('updated type in',p);
}else console.log('pattern not found in',p);
