import { NextResponse } from 'next/server';
import { chromium as playwright } from 'playwright-core';
import chromium from '@sparticuz/chromium';

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

    // --- PLAYWRIGHT + @sparticuz/chromium ---
    const isLocal = !process.env.VERCEL;
    
    const browser = await playwright.launch({
      args: isLocal ? [] : chromium.args,
      executablePath: isLocal 
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' 
        : await chromium.executablePath(),
      headless: true,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Go to login page
    await page.goto('https://jnanasudha.com/quiz/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('📄 Login page loaded');

    // Wait for the form fields
    await page.waitForSelector('#user, #pass, #btn-login', { timeout: 15000 });
    console.log('✅ Form found!');

    // Type credentials
    await page.fill('#user', username);
    console.log('📝 Username typed');

    await page.fill('#pass', password);
    console.log('📝 Password typed');

    // Click login
    await page.click('#btn-login');
    console.log('🖱️ Login button clicked');

    // Wait for navigation
    await page.waitForURL('**/quiz/**', { timeout: 30000 });
    console.log('📱 Navigation complete');

    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    if (currentUrl.includes('login')) {
      const errorText = await page.textContent('.error, .alert, .message, [class*="error"]');
      await browser.close();
      return NextResponse.json(
        { success: false, message: `Login failed: ${errorText || 'Unknown error'}` },
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