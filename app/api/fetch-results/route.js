import { NextResponse } from 'next/server';
import { Browserbase } from '@browserbasehq/sdk';

export async function GET(request) {
  try {
    const username = request.headers.get('x-username');
    const password = request.headers.get('x-password');

    if (!username || !password) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    console.log('📥 Fetching JUT results for:', username);
    const results = await fetchJutResults(username, password);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchJutResults(username, password) {
  console.log('🚀 Starting Browserbase session...');

  const bb = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY,
  });

  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID,
  });

  console.log(`✅ Session created: ${session.id}`);

  const result = await bb.sessions.connect(session.id, async (page) => {
    console.log('📱 Logging in as:', username);

    await page.goto('https://jnanasudha.com/quiz/login', { waitUntil: 'networkidle2' });
    await page.type('#user', username);
    await page.type('#pass', password);
    await page.click('#btn-login');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    if (page.url().includes('login')) {
      throw new Error('Login failed');
    }
    console.log('✅ Login successful!');

    console.log('📄 Fetching JUT list...');
    await page.goto('https://jnanasudha.com/quiz/quiz_inform?package=357', {
      waitUntil: 'networkidle2'
    });

    const jutIds = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="view_result"]');
      const ids = [];
      links.forEach(link => {
        const href = link.getAttribute('href');
        const match = href.match(/id=(\\d+)/);
        if (match) ids.push(parseInt(match[1]));
      });
      return ids;
    });

    console.log('📊 Found ' + jutIds.length + ' JUTs');

    const results = [];
    for (const id of jutIds) {
      console.log('📊 Fetching JUT ' + id + '...');
      await page.goto('https://jnanasudha.com/quiz/view_result?id=' + id, {
        waitUntil: 'networkidle2'
      });

      const data = await page.evaluate(() => {
        const text = document.body.innerText;

        const scoreMatch = text.match(/Total Score:\\s*(\\d+)/i);
        if (!scoreMatch) return null;
        const score = parseInt(scoreMatch[1]);
        if (score === 0) return null;

        const rankMatch = text.match(/RANK:\\s*(\\d+)/i);
        const rank = rankMatch ? parseInt(rankMatch[1]) : 0;

        const rows = document.querySelectorAll('table tr');
        let physics = 0, chemistry = 0, biology = 0;

        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 5) {
            const subject = cells[0].innerText.trim().toUpperCase();
            const marks = parseFloat(cells[4]?.innerText) || 0;
            if (subject.includes('PHYSICS')) physics = marks;
            else if (subject.includes('CHEMISTRY')) chemistry = marks;
            else if (subject.includes('BIOLOGY')) biology = marks;
          }
        });

        if (physics === 0 && chemistry === 0 && biology === 0) {
          const marksMatch = text.match(/Marks\\s+(\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)/);
          if (marksMatch) {
            physics = parseFloat(marksMatch[1]) || 0;
            chemistry = parseFloat(marksMatch[2]) || 0;
            biology = parseFloat(marksMatch[3]) || 0;
          }
        }

        return { score, rank, physics, chemistry, biology };
      });

      if (data) {
        results.push({ id, ...data });
        console.log('✅ JUT ' + id + ': Score ' + data.score + ', Rank ' + data.rank);
      }
    }

    console.log('✅ Done! Found ' + results.length + ' JUTs');
    return results;
  });

  return result;
}
