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

    // Create a session with cookie jar
    const session = axios.create({
      withCredentials: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // 1. Get login page to capture cookies
    const loginPageResponse = await session.get('https://jnanasudha.com/quiz/login');
    
    // 2. Extract CSRF token if present
    const html = loginPageResponse.data;
    const csrfMatch = html.match(/name="_token" value="([^"]+)"/i);
    const csrfToken = csrfMatch ? csrfMatch[1] : null;

    // 3. Prepare login data
    const formData = new URLSearchParams();
    formData.append('user', username);
    formData.append('pass', password);
    if (csrfToken) {
      formData.append('_token', csrfToken);
    }

    // 4. Submit login
    const loginResponse = await session.post(
      'https://jnanasudha.com/quiz/login',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      }
    );

    // 5. Check if login succeeded
    const isLoggedIn = loginResponse.status === 302 || 
                       loginResponse.data.includes('dashboard') ||
                       loginResponse.data.includes('quiz_inform');

    if (isLoggedIn) {
      // Extract all cookies from the session
      const cookies = session.defaults.headers.common['Cookie'] || '';
      console.log('✅ Login successful for:', username);
      console.log('🍪 Cookies:', cookies);
      
      // Also try to get cookies from the response
      const setCookieHeaders = loginResponse.headers['set-cookie'];
      let allCookies = cookies;
      if (setCookieHeaders) {
        const responseCookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
        allCookies = allCookies ? allCookies + '; ' + responseCookies : responseCookies;
      }

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: username,
        cookies: allCookies,
      });
    } else {
      console.log('❌ Login failed for:', username);
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