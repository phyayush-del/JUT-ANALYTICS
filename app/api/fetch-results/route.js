import { NextResponse } from 'next/server';
import axios from 'axios';
import cheerio from 'cheerio';

export async function GET(request) {
  try {
    const username = request.headers.get('x-username');
    const password = request.headers.get('x-password');
    const cookies = request.headers.get('x-cookies') || '';

    console.log('📥 Fetch Results API called');
    console.log('👤 Username:', username);
    console.log('🍪 Cookies present:', cookies.length > 0);

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return NextResponse.json(
        { error: 'Not authenticated. Please login first.' },
        { status: 401 }
      );
    }

    const results = await fetchJutResults(username, password, cookies);
    console.log('✅ Returning', results.length, 'results');
    return NextResponse.json(results);
  } catch (error) {
    console.error('❌ API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchJutResults(username, password, cookies) {
  console.log('🔍 Starting fetchJutResults for:', username);

  const session = axios.create({
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      ...(cookies && { 'Cookie': cookies }),
    },
  });

  try {
    // --- 1. LOGIN ---
    console.log('📱 Step 1: Logging in...');
    
    // If we have cookies, try using them first
    if (cookies) {
      console.log('🍪 Using existing cookies');
      // Try to access a protected page to verify cookies work
      try {
        const testResponse = await session.get('https://jnanasudha.com/quiz/quiz_inform?package=357');
        if (testResponse.data.includes('quiz_inform') || testResponse.status === 200) {
          console.log('✅ Cookies are valid!');
          // Skip login, proceed to fetching
        } else {
          console.log('⚠️ Cookies invalid, falling back to login');
          await performLogin(session, username, password);
        }
      } catch (e) {
        console.log('⚠️ Cookie test failed, falling back to login');
        await performLogin(session, username, password);
      }
    } else {
      await performLogin(session, username, password);
    }

    // --- 2. GET JUT LIST ---
    console.log('📄 Step 2: Fetching JUT list...');
    const listResponse = await session.get(
      'https://jnanasudha.com/quiz/quiz_inform?package=357'
    );

    console.log('📊 JUT list status:', listResponse.status);

    const $ = cheerio.load(listResponse.data);

    const jutIds = [];
    $('a[href*="view_result?id="]').each((i, el) => {
      const href = $(el).attr('href');
      const match = href.match(/id=(\d+)/);
      if (match) {
        jutIds.push(parseInt(match[1]));
      }
    });

    console.log(`📊 Step 2: Found ${jutIds.length} JUT IDs`);

    if (jutIds.length === 0) {
      console.log('⚠️ No IDs found. Using range method...');
      for (let id = 10400; id <= 10500; id++) {
        jutIds.push(id);
      }
    }

    // --- 3. FETCH EACH JUT ---
    console.log(`📊 Step 3: Fetching ${jutIds.length} JUTs...`);
    const results = [];
    const idsToFetch = jutIds.slice(0, 20);

    for (const id of idsToFetch) {
      try {
        console.log(`  📊 Fetching JUT ${id}...`);
        const resultResponse = await session.get(
          `https://jnanasudha.com/quiz/view_result?id=${id}`,
          { timeout: 10000 }
        );

        const $$ = cheerio.load(resultResponse.data);
        const pageText = $$('body').text();

        if (!pageText.includes('Total Score') && !pageText.includes('RANK')) {
          console.log(`  ⏭️ JUT ${id}: No data found, skipping`);
          continue;
        }

        const scoreMatch = pageText.match(/Total Score:\s*(\d+)/i);
        const rankMatch = pageText.match(/RANK:\s*(\d+)/i);

        let physics = 0, chemistry = 0, biology = 0;
        $$('table tr').each((i, row) => {
          const cells = $$(row).find('td');
          if (cells.length >= 5) {
            const subject = $$(cells[0]).text().trim().toUpperCase();
            const marks = parseFloat($$(cells[4]).text()) || 0;
            if (subject.includes('PHYSICS')) physics = marks;
            else if (subject.includes('CHEMISTRY')) chemistry = marks;
            else if (subject.includes('BIOLOGY')) biology = marks;
          }
        });

        if (physics === 0 && chemistry === 0 && biology === 0) {
          const marksMatch = pageText.match(/Marks\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/);
          if (marksMatch) {
            physics = parseFloat(marksMatch[1]) || 0;
            chemistry = parseFloat(marksMatch[2]) || 0;
            biology = parseFloat(marksMatch[3]) || 0;
          }
        }

        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        const rank = rankMatch ? parseInt(rankMatch[1]) : 0;

        if (score > 0 || physics > 0 || chemistry > 0 || biology > 0) {
          results.push({ id, score, rank, physics, chemistry, biology });
          console.log(`  ✅ JUT ${id}: Score ${score}, Rank ${rank}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.log(`  ❌ JUT ${id}: Error - ${error.message}`);
      }
    }

    console.log(`✅ Step 3: Done! Found ${results.length} JUTs`);
    results.sort((a, b) => b.id - a.id);
    return results;
  } catch (error) {
    console.error('❌ fetchJutResults error:', error.message);
    throw error;
  }
}

async function performLogin(session, username, password) {
  console.log('📱 Performing login...');
  await session.get('https://jnanasudha.com/quiz/login');

  const loginResponse = await session.post(
    'https://jnanasudha.com/quiz/login',
    new URLSearchParams({
      user: username,
      pass: password,
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    }
  );

  const isLoggedIn = loginResponse.status === 302 || 
                     loginResponse.data.includes('dashboard') ||
                     loginResponse.data.includes('quiz_inform');

  if (!isLoggedIn) {
    console.log('❌ Login failed');
    throw new Error('Login failed - incorrect credentials');
  }
  console.log('✅ Login successful!');
}