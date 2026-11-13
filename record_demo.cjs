const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

async function recordWalkthrough() {
  const recordingsDir = path.join(__dirname, 'recordings');
  const rawDir = path.join(recordingsDir, 'raw');

  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }

  console.log('🎥 Launching Brave Chromium with 1080p viewport recorder...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/brave-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: rawDir,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  // Helper for human-like smooth scrolling
  const smoothScroll = async (y) => {
    await page.evaluate((top) => {
      window.scrollBy({ top, behavior: 'smooth' });
    }, y);
    await page.waitForTimeout(1000);
  };

  console.log('🎬 Scene 1: Pigeon Landing & Sign In...');
  await page.goto('http://localhost:5173/?reset=true');
  await page.waitForTimeout(3000);

  console.log('🎬 Scene 2: Logging into Dashboard as Enemuo-debug...');
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MmNiNWI2ZC1iNjJmLTRjMjEtYTNkYi0zNjllZjY5MzYyYWEiLCJ1c2VybmFtZSI6IkVuZW11by1kZWJ1ZyIsImlhdCI6MTc5NDU3MzcwNCwiZXhwIjoxNzk1MTc4NTA0fQ.bqkhyP9AbudLsivQcb1y56qc-VhgysNvths3yfA2oJY';
  
  await page.evaluate((jwt) => {
    localStorage.setItem('pigeon_token', jwt);
  }, token);

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2500);

  console.log('🎬 Scene 3: Overview Dashboard & Connected Channels...');
  await smoothScroll(200);
  await page.waitForTimeout(2000);
  await smoothScroll(-200);
  await page.waitForTimeout(1500);

  console.log('🎬 Scene 4: Push Broadcast Approval Queue...');
  await page.click('span:has-text("Approval Queue")');
  await page.waitForTimeout(2500);
  await smoothScroll(200);
  await page.waitForTimeout(4000);
  await smoothScroll(-200);
  await page.waitForTimeout(1000);

  console.log('🎬 Scene 5: Repositories & JIT Codebase Indexing...');
  await page.click('span:has-text("Repositories")');
  await page.waitForTimeout(2500);
  
  // Click Sync Recent Pushes to show live activity sync
  const syncBtn = await page.$('button:has-text("Sync Recent Pushes"), button:has-text("Sync GitHub")');
  if (syncBtn) {
    await syncBtn.click();
    await page.waitForTimeout(2500);
  }
  await smoothScroll(200);
  await page.waitForTimeout(2500);
  await smoothScroll(-200);

  console.log('🎬 Scene 6: Interactive Live Tag Simulator...');
  await page.click('span:has-text("Tag Simulator")');
  await page.waitForTimeout(2000);

  // Type a realistic multi-commit push
  const textarea = await page.$('textarea');
  if (textarea) {
    await textarea.fill('feat: implement redis distributed rate limiter\nperf: zero-copy memory buffer state verification #Pigeon');
    await page.waitForTimeout(1200);
  }

  const simBtn = await page.$('button:has-text("Simulate Tag Routing"), button:has-text("Run Simulator")');
  if (simBtn) {
    await simBtn.click();
    await page.waitForTimeout(4000);
  }
  await smoothScroll(200);
  await page.waitForTimeout(2500);
  await smoothScroll(-200);

  console.log('🎬 Scene 7: Social Groups & Precision Routing...');
  await page.click('span:has-text("Social Groups")');
  await page.waitForTimeout(3000);

  console.log('🎬 Scene 8: LinkedIn Account Switching Modal & Channels...');
  try {
    await page.click('span:has-text("Dashboard")');
    await page.waitForTimeout(2000);
    await smoothScroll(300);

    // Click the + / Connect Channel button on the dashboard
    const addChannelBtn = await page.$('button[title="Connect another account"], button:has-text("Connect Channel")');
    if (addChannelBtn) {
      await addChannelBtn.click({ force: true });
      console.log('   Opened Connect Channels modal...');
      await page.waitForTimeout(3000);

      const liConnectBtn = await page.$('div:has-text("LinkedIn (Live OAuth 2.0)") button:has-text("Connect")');
      if (liConnectBtn) {
        await liConnectBtn.click({ force: true });
        console.log('   Opened LinkedIn Modal, presenting Options A & B...');
        await page.waitForTimeout(4000);

        // Close LinkedIn Switcher Modal
        await page.evaluate(() => {
          const btn = document.querySelector('[data-testid="close-linkedin-modal"]');
          if (btn) btn.click();
        });
        await page.waitForTimeout(1500);
      } else {
        await page.evaluate(() => {
          const btn = document.querySelector('[data-testid="close-connect-modal"]');
          if (btn) btn.click();
        });
        await page.waitForTimeout(1500);
      }
    }

    // Safety: dismiss any stray modals
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid^="close-"]').forEach(b => {
        if (b && typeof b.click === 'function') b.click();
      });
    }).catch(() => {});
    await page.waitForTimeout(1000);

    await smoothScroll(-300);
    await page.waitForTimeout(2000);
  } catch (scene8Err) {
    console.warn('Scene 8 non-fatal warning:', scene8Err.message);
  }

  console.log('🛑 Finishing recording...');
  const video = page.video();
  await page.close();
  await context.close();
  const videoPath = await video.path();
  await browser.close();

  console.log(`✅ Raw WebM video recorded at: ${videoPath}`);

  // Convert to high-quality MP4 using ffmpeg
  const finalMp4Path = path.join(recordingsDir, 'pigeon_hackathon_demo.mp4');
  console.log(`🎬 Transcoding to high-definition MP4: ${finalMp4Path}...`);

  try {
    execSync(`ffmpeg -y -i "${videoPath}" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p "${finalMp4Path}"`, {
      stdio: 'inherit',
    });
    console.log(`🎉 Demo Video successfully produced: ${finalMp4Path}`);
  } catch (ffmpegErr) {
    console.warn('FFmpeg transcoding error:', ffmpegErr.message);
  }

  console.log('Done!');
}

recordWalkthrough().catch(console.error);
