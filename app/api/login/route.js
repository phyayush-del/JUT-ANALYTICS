import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Attempting login for:', username);

    const response = await axios.post(
      `https://chrome.browserless.io/function?apiKey=${process.env.BROWSERLESS_API_KEY}`,
      {
        code: `
          (async () => {
            const browser = await puppeteer.launch({
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            await page.goto('https://jnanasudha.com/quiz/login', { waitUntil: 'networkidle2' });
            await page.type('#user', '${username}');
            await page.type('#pass', '${password}');
            await page.click('#btn-login');
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
            
            const currentUrl = page.url();
            const success = !currentUrl.includes('login');
            
            await browser.close();
            
            return { success };
          })()
        `
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const result = response.data;

    if (result.success) {
      console.log('✅ Login successful for:', username);
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: username,
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}