const fs = require('fs');
const p = 'src/context/auth-context.tsx';
let s = fs.readFileSync(p,'utf8');
s = s.replace("import { User as FirestoreUser } from \"@/types/user\";", "import { User as FirestoreUser } from \"@/types/user\";\nimport { accountNumberToDisplay } from \"@/lib/account-utils\";");
s = s.replace(/const userData = await res.json[\s\S]*?setUser\([\s\S]*?\);/m, `const userData = await res.json();\n\n      const accountNumber = (userData?.account_number || userData?.accountNumber || \"\").toString();\n\n      setUser({\n        userId: userData?.id || userData?.userId || userId,\n        phone: userData?.phone || \"\",\n        fullName: userData?.full_name || userData?.fullName || \"\",\n        accountNumber,\n        displayAccountNumber: accountNumber ? accountNumberToDisplay(accountNumber) : undefined,\n        isAgent: userData?.is_agent || userData?.isAgent || false,\n        kycTier: userData?.kyc_tier || userData?.kycTier || 1,\n        balance: typeof userData?.balance === \"number\" ? userData.balance : Number(userData?.balance) || 0,\n        email: userData?.email,\n        status: userData?.status || \"active\",\n        avatarUrl: userData?.avatar_url || userData?.avatarUrl,\n        photoUrl: userData?.photoUrl || userData?.avatar_url || userData?.avatarUrl,\n      });`);
fs.writeFileSync(p,s);
console.log('patched',p);
