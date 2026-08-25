import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

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

    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Go to login page
    await page.goto('https://jnanasudha.com/quiz/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    console.log('📄 Login page loaded');

    // Wait for the form fields using the correct IDs
    await page.waitForSelector('#user, #pass, #btn-login', { timeout: 15000 });
    console.log('✅ Form found!');

    // Use the exact IDs we found
    await page.type('#user', username);
    console.log('📝 Username typed');

    await page.type('#pass', password);
    console.log('📝 Password typed');

    // Click the login button using its exact ID
    await page.click('#btn-login');
    console.log('🖱️ Login button clicked');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log('📱 Navigation complete');

    // Check if login was successful
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // If we're still on login page, something went wrong
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

    // Take a screenshot of the dashboard
    await page.screenshot({ path: 'dashboard.png' });
    console.log('📸 Dashboard screenshot saved as dashboard.png');

    await browser.close();

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: username
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