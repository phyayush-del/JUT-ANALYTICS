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

    // 1. Get login page
    console.log('📄 Getting login page...');
    const loginPageResponse = await session.get('https://jnanasudha.com/quiz/login');
    
    // Check if there's a CSRF token
    const html = loginPageResponse.data;
    const csrfMatch = html.match(/name="_token" value="([^"]+)"/i);
    const csrfToken = csrfMatch ? csrfMatch[1] : null;
    console.log('🔑 CSRF Token:', csrfToken || 'None found');

    // 2. Prepare login data
    const formData = new URLSearchParams();
    formData.append('user', username);
    formData.append('pass', password);
    if (csrfToken) {
      formData.append('_token', csrfToken);
    }

    console.log('📤 Submitting login form...');
    const loginResponse = await session.post(
      'https://jnanasudha.com/quiz/login',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        maxRedirects: 5, // Allow redirects
        validateStatus: (status) => status < 500,
      }
    );

    console.log('📊 Login response status:', loginResponse.status);
    console.log('📊 Login response URL:', loginResponse.request?.res?.responseUrl || 'N/A');

    // Check if login succeeded
    const isLoggedIn = loginResponse.status === 302 || 
                       loginResponse.data.includes('dashboard') ||
                       loginResponse.data.includes('quiz_inform');

    if (isLoggedIn) {
      console.log('✅ Login successful for:', username);
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: username,
      });
    } else {
      console.log('❌ Login failed for:', username);
      console.log('📊 Response preview:', loginResponse.data.substring(0, 500));
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