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

async function main() {
  console.log('Launching Chrome for Landing Page screenshots...');
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
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result);
      }
    };

    await send('Page.enable');
    await send('DOM.enable');

    async function capture(filename, width, height, scrollY = 0, evaluateBefore = null) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width <= 768
      });

      if (evaluateBefore) {
        await send('Runtime.evaluate', { expression: evaluateBefore });
        await sleep(300);
      }

      if (scrollY > 0) {
        await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${scrollY})` });
        await sleep(300);
      }

      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(outDir, filename), Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${filename} (${width}x${height})`);
    }

    // 1. Navigate to landing page
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    // 2. 1440px Viewports for all 5 stages
    for (let i = 1; i <= 5; i++) {
      await capture(
        `landing-stage${i}-1440.png`,
        1440,
        900,
        0,
        `document.querySelectorAll('.landing-stepper-btn')[${i - 1}]?.click()`
      );
    }

    // 3. 390px Viewports for all 5 stages
    for (let i = 1; i <= 5; i++) {
      await capture(
        `landing-stage${i}-390.png`,
        390,
        844,
        0,
        `document.querySelectorAll('.landing-mobile-tab-btn')[${i - 1}]?.click()`
      );
    }

    // 4. Capture remaining sections at 1440px
    await capture('landing-sources-1440.png', 1440, 900, 950);
    await capture('landing-capabilities-1440.png', 1440, 900, 1550);
    await capture('landing-architecture-1440.png', 1440, 900, 2350);
    await capture('landing-method-team-1440.png', 1440, 900, 3100);

    // 5. Capture mobile scroll viewports
    await capture('landing-sources-390.png', 390, 844, 1100);
    await capture('landing-capabilities-390.png', 390, 844, 2100);
    await capture('landing-architecture-390.png', 390, 844, 3200);
    await capture('landing-method-team-390.png', 390, 844, 4400);

    ws.close();
    console.log('Finished capturing all screenshots!');
  } catch (err) {
    console.error('Screenshot capture error:', err);
  } finally {
    chromeProc.kill();
  }
}

main();
