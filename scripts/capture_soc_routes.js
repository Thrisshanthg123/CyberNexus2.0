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

const routes = [
  { name: 'graph', path: '/dashboard/graph' },
  { name: 'ml', path: '/dashboard/ml' },
  { name: 'iocs', path: '/dashboard/iocs' },
  { name: 'campaigns', path: '/dashboard/campaigns' },
  { name: 'investigation', path: '/dashboard/investigation' },
  { name: 'reports', path: '/dashboard/reports' },
  { name: 'sources', path: '/dashboard/sources' },
  { name: 'alerts', path: '/dashboard/alerts' }
];

async function main() {
  console.log('Launching headless Chrome for SOC dashboard screenshots...');
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9224',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9224/json');
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

    for (const route of routes) {
      console.log(`Processing route: ${route.name} (${route.path})`);

      // 1440px desktop
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
      });
      await send('Page.navigate', { url: `http://localhost:5173${route.path}` });
      await sleep(1200);

      const shot1440 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(outDir, `${route.name}-1440.png`), Buffer.from(shot1440.data, 'base64'));
      console.log(`Saved ${route.name}-1440.png`);

      // 390px mobile
      await send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true
      });
      await send('Page.navigate', { url: `http://localhost:5173${route.path}` });
      await sleep(1200);

      const shot390 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(outDir, `${route.name}-390.png`), Buffer.from(shot390.data, 'base64'));
      console.log(`Saved ${route.name}-390.png`);
    }

    console.log('All 16 screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    chromeProc.kill();
  }
}

main();
