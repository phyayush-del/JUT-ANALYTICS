import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import fs from 'fs';
import path from 'path';

// --- CHROMIUM DOWNLOAD URL ---
const CHROMIUM_URL = 'https://github.com/Sparticuz/chromium/releases/download/v122.0.0/chromium-v122.0.0-pack.tar';

async function getChromiumPath() {
  try {
    // Let chromium-min handle the download
    const execPath = await chromium.executablePath(CHROMIUM_URL);
    if (fs.existsSync(execPath)) {
      return execPath;
    }
  } catch (e) {
    console.log('⚠️ Download failed, checking cache...');
  }

  // Check if already downloaded
  const cachedPaths = [
    '/tmp/chromium',
    '/tmp/chromium-pack/chromium',
    path.join(process.cwd(), '.cache/chromium'),
  ];

  for (const p of cachedPaths) {
    if (fs.existsSync(p)) {
      console.log('✅ Using cached Chromium at:', p);
      return p;
    }
  }

  throw new Error('❌ Could not find or download Chromium');
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

    // --- GET CHROMIUM ---
    const executablePath = await getChromiumPath();
    console.log('🔍 Using Chromium at:', executablePath);

    // --- LAUNCH PUPPETEER ---
    browser = await puppeteer.launch({
      headless: true,
      args: chromium.args, // Use chromium-min's default args
      executablePath: executablePath,
    });

    const page = await browser.newPage();

    await page.goto('https://jnanasudha.com/quiz/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('📄 Login page loaded');

    await page.waitForSelector('#user, #pass, #btn-login', { timeout: 15000 });
    console.log('✅ Form found!');

    await page.type('#user', username);
    console.log('📝 Username typed');

    await page.type('#pass', password);
    console.log('📝 Password typed');

    await page.click('#btn-login');
    console.log('🖱️ Login button clicked');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log('📱 Navigation complete');

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