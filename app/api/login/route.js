import { NextResponse } from 'next/server';
import { Browserbase } from '@browserbasehq/sdk';

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

    const bb = new Browserbase({
      apiKey: process.env.BROWSERBASE_API_KEY,
    });

    const session = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
    });

    console.log(`✅ Session created: ${session.id}`);

    const result = await bb.sessions.connect(session.id, async (page) => {
      await page.goto('https://jnanasudha.com/quiz/login', { waitUntil: 'networkidle2' });
      await page.type('#user', username);
      await page.type('#pass', password);
      await page.click('#btn-login');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      const currentUrl = page.url();
      const success = !currentUrl.includes('login');

      if (success) {
        const cookies = await page.cookies();
        console.log('✅ Login successful for:', username);
        return { success: true, cookies };
      } else {
        console.log('❌ Login failed for:', username);
        return { success: false };
      }
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: username,
        cookies: result.cookies,
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
