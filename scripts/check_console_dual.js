import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const routes = [
  '/',
  '/dashboard',
  '/dashboard/feed',
  '/dashboard/threats/THR-1999-0095',
  '/dashboard/alerts',
  '/dashboard/analytics',
  '/dashboard/graph',
  '/dashboard/ml',
  '/dashboard/iocs',
  '/dashboard/campaigns',
  '/dashboard/investigation',
  '/dashboard/reports',
  '/dashboard/sources'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runConsoleAudit(label = '') {
  console.log(`\n======================================================`);
  console.log(`STARTING CONSOLE AUDIT: ${label}`);
  console.log(`======================================================`);

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9223',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9223/json');
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
      pageIssues[r] = { errors: [], warnings: [], networkFailures: [] };
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
        const entry = `[${m.source || 'console'}] ${m.text}`;
        if (m.level === 'error') {
          pageIssues[currentRoute].errors.push(entry);
        } else if (m.level === 'warning') {
          pageIssues[currentRoute].warnings.push(entry);
        }
      }

      if (msg.method === 'Log.entryAdded') {
        const entry = msg.params.entry;
        const text = `[Log.${entry.source || 'browser'}] ${entry.text || ''} ${entry.url ? '(' + entry.url + ')' : ''}`;
        if (entry.level === 'error') {
          pageIssues[currentRoute].errors.push(text);
        } else if (entry.level === 'warning') {
          pageIssues[currentRoute].warnings.push(text);
        }
      }

      if (msg.method === 'Network.loadingFailed') {
        const p = msg.params;
        pageIssues[currentRoute].networkFailures.push(`Failed URL: ${p.errorText} (type: ${p.type})`);
      }

      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        if (type === 'error') {
          pageIssues[currentRoute].errors.push(`[console.error] ${text}`);
        } else if (type === 'warning') {
          pageIssues[currentRoute].warnings.push(`[console.warn] ${text}`);
        }
      }

      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params.exceptionDetails?.text || 'Uncaught exception';
        pageIssues[currentRoute].errors.push(`[UncaughtException] ${text}`);
      }
    };

    await send('Console.enable');
    await send('Log.enable');
    await send('Network.enable');
    await send('Runtime.enable');
    await send('Page.enable');

    for (const r of routes) {
      currentRoute = r;
      const targetUrl = `http://localhost:5173${r}`;
      await send('Page.navigate', { url: targetUrl });
      await sleep(1400); // Allow render & async fetching
    }

    ws.close();

    console.log(`\n=== RESULTS FOR: ${label} ===`);
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalNetworkFailures = 0;

    for (const r of routes) {
      const res = pageIssues[r];
      totalErrors += res.errors.length;
      totalWarnings += res.warnings.length;
      totalNetworkFailures += res.networkFailures.length;

      console.log(`\nRoute: ${r}`);
      console.log(`  Console Errors:    ${res.errors.length}`);
      if (res.errors.length > 0) {
        res.errors.forEach(e => console.log(`    - ${e}`));
      }
      console.log(`  Console Warnings:  ${res.warnings.length}`);
      if (res.warnings.length > 0) {
        res.warnings.forEach(w => console.log(`    - ${w}`));
      }
      console.log(`  Network Failures:  ${res.networkFailures.length}`);
      if (res.networkFailures.length > 0) {
        res.networkFailures.forEach(n => console.log(`    - ${n}`));
      }
    }

    console.log(`\n------------------------------------------------------`);
    console.log(`TOTAL (${label}):`);
    console.log(`  Errors:           ${totalErrors}`);
    console.log(`  Warnings:         ${totalWarnings}`);
    console.log(`  Network Failures: ${totalNetworkFailures}`);
    console.log(`------------------------------------------------------\n`);

  } finally {
    chromeProc.kill();
  }
}

if (process.argv[1]?.endsWith('check_console_dual.js')) {
  const label = process.argv[2] || 'SINGLE RUN';
  runConsoleAudit(label).catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
}
