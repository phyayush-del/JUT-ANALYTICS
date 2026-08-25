import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(request) {
  try {
    const username = request.headers.get('x-username');
    const password = request.headers.get('x-password');

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Not authenticated. Please login first.' },
        { status: 401 }
      );
    }

    const results = await fetchJutResults(username, password);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchJutResults(username, password) {
  console.log('🔍 Fetching JUT results for:', username);

  // --- CREATE A SESSION ---
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

  try {
    // 1. LOGIN
    console.log('📱 Logging in...');
    await session.get('https://jnanasudha.com/quiz/login');

    const loginResponse = await session.post(
      'https://jnanasudha.com/quiz/login',
      new URLSearchParams({
        user: username,
        pass: password,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 400 || status === 302,
      }
    );

    const isLoggedIn = loginResponse.status === 302 || 
                       !loginResponse.data.includes('login');

    if (!isLoggedIn) {
      throw new Error('Login failed - incorrect credentials');
    }
    console.log('✅ Login successful!');

    // 2. GET JUT LIST PAGE
    console.log('📄 Fetching JUT list...');
    const listResponse = await session.get(
      'https://jnanasudha.com/quiz/quiz_inform?package=357'
    );

    const $ = cheerio.load(listResponse.data);

    // 3. EXTRACT JUT IDs
    const jutIds = [];
    $('a[href*="view_result?id="]').each((i, el) => {
      const href = $(el).attr('href');
      const match = href.match(/id=(\d+)/);
      if (match) {
        jutIds.push(parseInt(match[1]));
      }
    });

    console.log(`📊 Found ${jutIds.length} JUT IDs`);

    if (jutIds.length === 0) {
      console.log('⚠️ No IDs found. Using range method...');
      for (let id = 10400; id <= 10500; id++) {
        jutIds.push(id);
      }
    }

    // 4. FETCH EACH JUT
    const results = [];
    const idsToFetch = jutIds.slice(0, 20);
    console.log(`📊 Fetching ${idsToFetch.length} JUTs...`);

    for (const id of idsToFetch) {
      try {
        console.log(`📊 Fetching JUT ${id}...`);
        const resultResponse = await session.get(
          `https://jnanasudha.com/quiz/view_result?id=${id}`,
          { timeout: 10000 }
        );

        const $$ = cheerio.load(resultResponse.data);
        const pageText = $$('body').text();

        if (!pageText.includes('Total Score') && !pageText.includes('RANK')) {
          console.log(`⏭️ JUT ${id}: No data found, skipping`);
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
          console.log(`✅ JUT ${id}: Score ${score}, Rank ${rank}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.log(`❌ JUT ${id}: Error - ${error.message}`);
      }
    }

    console.log(`✅ Done! Found ${results.length} JUTs`);
    results.sort((a, b) => b.id - a.id);
    return results;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}