import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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
  console.log('🚀 Launching browser for:', username);

  let executablePath;
  
  if (process.env.VERCEL) {
    executablePath = await chromium.executablePath();
    console.log('🔍 Using Chromium at:', executablePath);
  } else {
    executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    console.log('🔍 Using local Chrome at:', executablePath);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: executablePath,
  });

  const page = await browser.newPage();

  try {
    console.log('📱 Logging in as:', username);
    await page.goto('https://jnanasudha.com/quiz/login', { waitUntil: 'networkidle2' });
    await page.type('#user', username);
    await page.type('#pass', password);
    await page.click('#btn-login');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    if (page.url().includes('login')) {
      throw new Error('Login failed - incorrect credentials');
    }
    console.log('✅ Login successful!');

    await page.goto('https://jnanasudha.com/quiz/quiz_inform?package=357', {
      waitUntil: 'networkidle2',
    });
    console.log('📄 JUT list page loaded');

    const jutIds = await page.evaluate(() => {
      const ids = [];
      const links = document.querySelectorAll('a[href*="view_result?id="]');
      links.forEach((link) => {
        const href = link.getAttribute('href');
        const match = href.match(/id=(\d+)/);
        if (match) {
          ids.push(parseInt(match[1]));
        }
      });
      return ids;
    });

    console.log(`📊 Found ${jutIds.length} JUTs on the list page`);

    if (jutIds.length === 0) {
      console.log('⚠️ No IDs found on list page. Using range method...');
      for (let id = 10400; id <= 10500; id++) {
        jutIds.push(id);
      }
    }

    const results = [];
    for (const id of jutIds) {
      try {
        console.log(`📊 Fetching JUT ${id}...`);

        await page.goto(`https://jnanasudha.com/quiz/view_result?id=${id}`, {
          waitUntil: 'networkidle2',
          timeout: 10000,
        });

        const isValid = await page.evaluate(() => {
          const text = document.body.innerText;
          return text.includes('Total Score') || text.includes('RANK');
        });

        if (!isValid) {
          console.log(`⏭️ JUT ${id}: No data found, skipping`);
          continue;
        }

        const data = await page.evaluate(() => {
          const text = document.body.innerText;

          const scoreMatch = text.match(/Total Score:\s*(\d+)/i);
          const rankMatch = text.match(/RANK:\s*(\d+)/i);

          const rows = document.querySelectorAll('table tr');
          let physics = 0,
            chemistry = 0,
            biology = 0;

          rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
              const subject = cells[0].innerText.trim().toUpperCase();
              if (subject.includes('PHYSICS')) {
                physics = parseFloat(cells[4]?.innerText) || 0;
              } else if (subject.includes('CHEMISTRY')) {
                chemistry = parseFloat(cells[4]?.innerText) || 0;
              } else if (subject.includes('BIOLOGY')) {
                biology = parseFloat(cells[4]?.innerText) || 0;
              }
            }
          });

          if (physics === 0 && chemistry === 0 && biology === 0) {
            const marksMatch = text.match(/Marks\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/);
            if (marksMatch) {
              physics = parseFloat(marksMatch[1]) || 0;
              chemistry = parseFloat(marksMatch[2]) || 0;
              biology = parseFloat(marksMatch[3]) || 0;
            }
          }

          return {
            score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
            rank: rankMatch ? parseInt(rankMatch[1]) : 0,
            physics,
            chemistry,
            biology,
          };
        });

        if (data.score > 0 || data.physics > 0 || data.chemistry > 0 || data.biology > 0) {
          results.push({ id, ...data });
          console.log(`✅ JUT ${id}: Score ${data.score}, Rank ${data.rank}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`❌ JUT ${id}: Error - ${error.message}`);
      }
    }

    console.log(`✅ Scan complete! Found ${results.length} JUTs.`);
    await browser.close();

    results.sort((a, b) => b.id - a.id);
    return results;
  } catch (error) {
    console.error('Error:', error);
    await browser.close();
    throw error;
  }
}