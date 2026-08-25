import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

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

    // --- RUNTIME CHROME DETECTION ---
    let executablePath;
    const fs = await import('fs');

    if (process.env.VERCEL) {
      // On Vercel - check multiple system paths
      const possiblePaths = [
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/chrome',
      ];
      
      let foundPath = null;
      for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
          foundPath = path;
          break;
        }
      }
      
      if (foundPath) {
        executablePath = foundPath;
        console.log(`🔍 Using system Chrome at: ${executablePath}`);
      } else {
        // Fallback: try @sparticuz/chromium
        try {
          const chromium = await import('@sparticuz/chromium');
          executablePath = await chromium.executablePath();
          console.log(`🔍 Using @sparticuz/chromium at: ${executablePath}`);
        } catch (error) {
          console.log('⚠️ All Chrome detection methods failed');
          throw new Error('Could not find Chrome on this system');
        }
      }
    } else {
      // Local development
      const localPaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      ];
      
      for (const path of localPaths) {
        if (fs.existsSync(path)) {
          executablePath = path;
          break;
        }
      }
      
      executablePath = executablePath || '/usr/bin/chromium-browser';
      console.log(`🔍 Running locally, using: ${executablePath}`);
    }

    // Launch browser
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