const endpoints = [
  '/api/health',
  '/api/threats',
  '/api/sources',
  '/api/collect/nvd',
  '/api/collect/github'
];

async function test() {
  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://127.0.0.1:5000${ep}`);
      console.log(`GET ${ep}: ${res.status}`);
    } catch (e) {
      console.log(`GET ${ep}: error ${e.message}`);
    }
  }
}

test();
