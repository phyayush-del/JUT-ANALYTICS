import { NextResponse } from 'next/server';
import axios from 'axios';
import cheerio from 'cheerio';

export async function GET(request) {
  try {
    const username = request.headers.get('x-username');
    const password = request.headers.get('x-password');
    const cookies = request.headers.get('x-cookies') || '';

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Not authenticated. Please login first.' },
        { status: 401 }
      );
    }

    const results = await fetchJutResults(username, password, cookies);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchJutResults(username, password, cookies) {
  console.log('🔍 Starting fast JUT scan for:', username);

  const session = axios.create({
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...(cookies && { 'Cookie': cookies }),
    },
  });

  try {
    // --- 1. LOGIN ---
    if (!cookies) {
      console.log('📱 Logging in...');
      await session.get('https://jnanasudha.com/quiz/login');
      const loginResponse = await session.post(
        'https://jnanasudha.com/quiz/login',
        new URLSearchParams({ user: username, pass: password }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
        }
      );
      
      const isLoggedIn = loginResponse.status === 302 || 
                         loginResponse.data.includes('dashboard') ||
                         loginResponse.data.includes('quiz_inform');
      
      if (!isLoggedIn) throw new Error('Login failed');
      console.log('✅ Login successful!');
    }

    // --- 2. QUICK SCAN: ONLY CHECK FOR "Total Score" ---
    console.log('📊 Scanning 9000-12000 for valid JUTs (quick check)...');
    const results = [];
    const totalIds = 3001;
    let foundCount = 0;
    let checkedCount = 0;

    for (let id = 9000; id <= 12000; id++) {
      checkedCount++;
      
      // Progress update every 500 IDs
      if (checkedCount % 500 === 0) {
        console.log(`⏳ Scanned ${checkedCount}/${totalIds} IDs, found ${foundCount} valid JUTs`);
      }

      try {
        // --- FAST CHECK: Only get the page and check for "Total Score" ---
        const response = await session.get(
          `https://jnanasudha.com/quiz/view_result?id=${id}`,
          { timeout: 5000 } // 5 second timeout
        );

        // QUICK CHECK: Does this page have "Total Score"?
        if (!response.data.includes('Total Score') && !response.data.includes('RANK')) {
          continue; // Skip this ID immediately
        }

        // If we get here, it's a valid JUT!
        console.log(`✅ Found valid JUT ${id}`);
        const $$ = cheerio.load(response.data);
        const pageText = $$('body').text();

        // Extract data
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

        results.push({ id, score, rank, physics, chemistry, biology });
        foundCount++;
        console.log(`✅ JUT ${id}: Score ${score}, Rank ${rank}`);

      } catch (error) {
        // Silent skip on errors (timeout, network, etc.)
        continue;
      }
    }

    console.log(`✅ Scan complete! Checked ${checkedCount} IDs, found ${results.length} valid JUTs`);
    results.sort((a, b) => b.id - a.id);
    return results;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}