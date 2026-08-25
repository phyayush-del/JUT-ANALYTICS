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

    // --- 2. SCAN 9000-12000 ---
    console.log('📊 Scanning 9000-12000 for valid JUTs...');
    const results = [];
    let foundCount = 0;
    let checkedCount = 0;

    for (let id = 9000; id <= 12000; id++) {
      checkedCount++;
      
      if (checkedCount % 500 === 0) {
        console.log(`⏳ Scanned ${checkedCount}/3001 IDs, found ${foundCount} valid JUTs`);
      }

      try {
        const response = await session.get(
          `https://jnanasudha.com/quiz/view_result?id=${id}`,
          { timeout: 5000 }
        );

        const $$ = cheerio.load(response.data);
        const pageText = $$('body').text();

        // --- CHECK IF THIS IS A VALID JUT ---
        // 1. Must have "Total Score"
        const scoreMatch = pageText.match(/Total Score:\s*(\d+)/i);
        if (!scoreMatch) continue;
        
        const score = parseInt(scoreMatch[1]);
        
        // 2. Score must be > 0 (skip empty placeholder pages)
        if (score === 0) {
          console.log(`⏭️ JUT ${id}: Score 0 (empty/placeholder), skipping`);
          continue;
        }

        // 3. Must have "RANK"
        const rankMatch = pageText.match(/RANK:\s*(\d+)/i);
        if (!rankMatch) continue;
        
        const rank = parseInt(rankMatch[1]);
        if (rank === 0 || rank === 1) {
          // Rank 0 or 1 could be placeholder, check if there's any correct answer
          const hasCorrect = pageText.includes('Correct Answer');
          if (!hasCorrect) {
            console.log(`⏭️ JUT ${id}: Rank ${rank} but no correct answers, skipping`);
            continue;
          }
        }

        // --- EXTRACT SUBJECT DATA ---
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

        // Fallback: try regex for marks
        if (physics === 0 && chemistry === 0 && biology === 0) {
          const marksMatch = pageText.match(/Marks\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/);
          if (marksMatch) {
            physics = parseFloat(marksMatch[1]) || 0;
            chemistry = parseFloat(marksMatch[2]) || 0;
            biology = parseFloat(marksMatch[3]) || 0;
          }
        }

        // Only save if we have at least one subject mark
        if (physics > 0 || chemistry > 0 || biology > 0 || score > 0) {
          results.push({ id, score, rank, physics, chemistry, biology });
          foundCount++;
          console.log(`✅ JUT ${id}: Score ${score}, Rank ${rank}, P:${physics} C:${chemistry} B:${biology}`);
        }

      } catch (error) {
        // Silent skip on errors
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