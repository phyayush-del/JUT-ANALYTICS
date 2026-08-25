import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import fs from 'fs';

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

    // --- CHROME DETECTION ---
    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    if (!executablePath) {
      const possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/chrome',
        '/usr/bin/chromium-browser-stable',
        '/usr/bin/google-chrome-stable',
      ];

      for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
          executablePath = path;
          break;
        }
      }

      executablePath = executablePath || '/usr/bin/chromium-browser';
      console.log(`🔍 Using browser at: ${executablePath}`);
    }

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: executablePath,
    });

    const page = await browser.newPage();

    // Go to login page
    await page.goto('https://jnanasudha.com/quiz/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('📄 Login page loaded');

    // Wait for the form fields
    await page.waitForSelector('#user, #pass, #btn-login', { timeout: 15000 });
    console.log('✅ Form found!');

    // Type credentials
    await page.type('#user', username);
    console.log('📝 Username typed');

    await page.type('#pass', password);
    console.log('📝 Password typed');

    // Click login
    await page.click('#btn-login');
    console.log('🖱️ Login button clicked');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log('📱 Navigation complete');

    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    if (currentUrl.includes('login')) {
      const errorText = await page.evaluate(() => {
        const errorElement = document.querySelector('.error, .alert, .message, [class*="error"]');
        return errorElement ? errorElement.innerText : 'Unknown error';
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