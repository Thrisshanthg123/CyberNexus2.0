import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(process.cwd(), 'screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const targets = [
  { name: 'landing', path: '/' },
  { name: 'overview', path: '/dashboard' },
  { name: 'feed', path: '/dashboard/feed' },
  { name: 'details', path: '/dashboard/threats/THR-1999-0095' },
  { name: 'alerts', path: '/dashboard/alerts' },
  { name: 'analytics', path: '/dashboard/analytics' },
  { name: 'graph', path: '/dashboard/graph' },
  { name: 'ml', path: '/dashboard/ml' },
  { name: 'iocs', path: '/dashboard/iocs' },
  { name: 'campaigns', path: '/dashboard/campaigns' },
  { name: 'investigation', path: '/dashboard/investigation' },
  { name: 'reports', path: '/dashboard/reports' },
  { name: 'sources', path: '/dashboard/sources' }
];

const breakpoints = [
  { label: '1440', width: 1440, height: 900, mobile: false },
  { label: '1024', width: 1024, height: 768, mobile: false },
  { label: '768', width: 768, height: 1024, mobile: false },
  { label: '390', width: 390, height: 844, mobile: true }
];

async function main() {
  console.log('Capturing all 13 routes across 1440, 1024, 768, 390 on restored dark navy theme (52 total)...');
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9225',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9225/json');
    const tabs = await listRes.json();
    const tab = tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();

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
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        const cb = callbacks.get(data.id);
        callbacks.delete(data.id);
        cb(data.result);
      }
    };

    await send('Page.enable');

    for (const target of targets) {
      for (const bp of breakpoints) {
        await send('Emulation.setDeviceMetricsOverride', {
          width: bp.width,
          height: bp.height,
          deviceScaleFactor: bp.mobile ? 2 : 1,
          mobile: bp.mobile
        });

        await send('Page.navigate', { url: `http://localhost:5173${target.path}` });
        await sleep(700);

        const shot = await send('Page.captureScreenshot', { format: 'png' });
        const filePath = path.join(outDir, `${target.name}-${bp.label}.png`);
        fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
        console.log(`Saved: ${target.name}-${bp.label}.png`);
      }
    }

    ws.close();
    console.log('All 52 dark navy responsive screenshots captured successfully.');
  } finally {
    chromeProc.kill();
  }
}

main().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
