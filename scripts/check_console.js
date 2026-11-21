import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const routes = [
  '/',
  '/dashboard',
  '/dashboard/feed',
  '/dashboard/threats/THR-1999-0095',
  '/dashboard/graph',
  '/dashboard/ioc',
  '/dashboard/ml',
  '/dashboard/campaigns',
  '/dashboard/analytics',
  '/dashboard/sources',
  '/dashboard/reports',
  '/dashboard/investigations'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Launching headless Chrome with CDP on port 9222...');
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    const tab = tabs[0];
    if (!tab || !tab.webSocketDebuggerUrl) {
      throw new Error('No debugger WebSocket URL found');
    }

    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();
    const pageIssues = {};

    routes.forEach(r => {
      pageIssues[r] = { errors: [], warnings: [] };
    });

    let currentRoute = routes[0];

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result);
        return;
      }

      if (msg.method === 'Console.messageAdded') {
        const m = msg.params.message;
        if (m.level === 'error') {
          pageIssues[currentRoute].errors.push(m.text);
        } else if (m.level === 'warning') {
          pageIssues[currentRoute].warnings.push(m.text);
        }
      }

      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        if (type === 'error') {
          pageIssues[currentRoute].errors.push(text);
        } else if (type === 'warning') {
          pageIssues[currentRoute].warnings.push(text);
        }
      }

      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params.exceptionDetails?.text || 'Uncaught exception';
        pageIssues[currentRoute].errors.push(text);
      }
    };

    await send('Console.enable');
    await send('Runtime.enable');
    await send('Page.enable');

    for (const r of routes) {
      currentRoute = r;
      const targetUrl = `http://localhost:5173${r}`;
      await send('Page.navigate', { url: targetUrl });
      await sleep(1500); // Wait for page to render and trigger async effects
    }

    ws.close();

    console.log('\n=== CONSOLE ERRORS AND WARNINGS AUDIT ===');
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const r of routes) {
      const res = pageIssues[r];
      totalErrors += res.errors.length;
      totalWarnings += res.warnings.length;
      console.log(`Page: ${r}`);
      console.log(`  Errors:   ${res.errors.length}${res.errors.length > 0 ? ' -> ' + res.errors.join('; ') : ''}`);
      console.log(`  Warnings: ${res.warnings.length}${res.warnings.length > 0 ? ' -> ' + res.warnings.join('; ') : ''}`);
    }

    console.log(`\nTOTAL: ${totalErrors} errors, ${totalWarnings} warnings across ${routes.length} pages.`);

  } finally {
    chromeProc.kill();
  }
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
