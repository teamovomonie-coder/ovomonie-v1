const BASE = process.env.BASE_URL || 'https://ovomonie-v1.vercel.app';
const endpoints = ['/api/health', '/api/health/supabase'];

(async () => {
  for (const path of endpoints) {
    const url = BASE.replace(/\/$/, '') + path;
    try {
      const res = await fetch(url, { method: 'GET' });
      const text = await res.text();
      console.log('---');
      console.log('URL:', url);
      console.log('STATUS:', res.status);
      try {
        const parsed = JSON.parse(text);
        console.log('JSON:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('BODY:', text.slice(0, 8000));
      }
    } catch (err) {
      console.error('---');
      console.error('URL:', url);
      console.error('ERROR:', err.message || err);
    }
  }
})();
(async ()=>{
  for (const path of endpoints) {
    const url = BASE.replace(/\/$/, '') + path;
    try {
      const res = await fetch(url, { method: 'GET' });
      const text = await res.text();
      console.log('---');
      console.log('URL:', url);
      console.log('STATUS:', res.status);
      console.log('BODY:', text.slice(0, 1000));
    } catch (err) {
      console.error('---');
      console.error('URL:', url);
      console.error('ERROR:', err.message || err);
    }
  }
})();
