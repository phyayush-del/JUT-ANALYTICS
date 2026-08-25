import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import fs from 'fs';
import path from 'path';

// --- HELPER: Find Chromium executable ---
async function findChromium() {
  console.log('🔍 Searching for Chromium...');

  // 1. Check if @sparticuz/chromium-min can find it
  try {
    const execPath = await chromium.executablePath();
    if (fs.existsSync(execPath)) {
      console.log('✅ Found Chromium via @sparticuz/chromium-min at:', execPath);
      return execPath;
    }
  } catch (e) {
    console.log('⚠️ chromium.executablePath() failed:', e.message);
  }

  // 2. Check common Vercel paths
  const possiblePaths = [
    '/var/task/.next/server/bin/chromium',
    '/var/task/bin/chromium',
    '/tmp/bin/chromium',
    path.join(process.cwd(), '.next/server/bin/chromium'),
    path.join(process.cwd(), 'bin/chromium'),
    path.join(process.cwd(), 'node_modules/@sparticuz/chromium-min/bin/chromium'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log('✅ Found Chromium at:', p);
      return p;
    }
  }

  // 3. Fallback to system Chrome
  const fallbackPaths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];

  for (const p of fallbackPaths) {
    if (fs.existsSync(p)) {
      console.log('✅ Using fallback Chromium at:', p);
      return p;
    }
  }

  throw new Error('❌ Could not find Chromium executable anywhere');
}

export async function POST(request) {
  let browser = null;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Attempting login for:', username);

    // --- FIND CHROMIUM ---
    const executablePath = await findChromium();
    console.log('🔍 Using Chromium at:', executablePath);

    // --- LAUNCH PUPPETEER ---
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      executablePath: executablePath,
    });

    const page = await browser.newPage();

    // --- GO TO LOGIN PAGE ---
    await page.goto('https://jnanasudha.com/quiz/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('📄 Login page loaded');

    // --- WAIT FOR FORM ---
    await page.waitForSelector('#user, #pass, #btn-login', { timeout: 15000 });
    console.log('✅ Form found!');

    // --- FILL CREDENTIALS ---
    await page.type('#user', username);
    console.log('📝 Username typed');

    await page.type('#pass', password);
    console.log('📝 Password typed');

    // --- CLICK LOGIN ---
    await page.click('#btn-login');
    console.log('🖱️ Login button clicked');

    // --- WAIT FOR NAVIGATION ---
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log('📱 Navigation complete');

    // --- CHECK IF LOGIN SUCCEEDED ---
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    if (currentUrl.includes('login')) {
      const errorText = await page.evaluate(() => {
        const el = document.querySelector('.error, .alert, .message');
        return el ? el.innerText : 'Unknown error';
      });
      
      await browser.close();
      return NextResponse.json(
        { success: false, message: `Login failed: ${errorText}` },
        { status: 401 }
      );
    }

    console.log('✅ Login successful for:', username);
    await browser.close();

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: username,
    });

  } catch (error) {
    console.error('❌ Login error:', error);

    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}