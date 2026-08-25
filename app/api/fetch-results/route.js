import { NextResponse } from 'next/server';
import axios from 'axios';

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

    // --- USE BROWSERLESS TOKEN MODE ---
    const response = await axios.post(
      `https://chrome.browserless.io/function?apiKey=${process.env.BROWSERLESS_API_KEY}`,
      {
        code: `
          (async () => {
            const browser = await puppeteer.launch({ 
              headless: true,
              args: ['--no-sandbox']
            });
            const page = await browser.newPage();
            
            console.log('📱 Logging in...');
            
            await page.goto('https://jnanasudha.com/quiz/login', {
              waitUntil: 'networkidle2',
              timeout: 15000
            });
            
            await page.type('#user', '${username}');
            await page.type('#pass', '${password}');
            await page.click('#btn-login');
            
            await page.waitForNavigation({ 
              waitUntil: 'networkidle2', 
              timeout: 15000 
            });
            
            if (page.url().includes('login')) {
              throw new Error('Login failed');
            }
            
            console.log('✅ Login successful!');
            await page.goto('https://jnanasudha.com/quiz/quiz_inform?package=357');
            
            // ONLY GET THE FIRST 10 JUT IDs
            const jutIds = await page.evaluate(() => {
              const links = document.querySelectorAll('a[href*="view_result?id="]');
              const ids = [];
              links.forEach(link => {
                const href = link.getAttribute('href');
                const match = href.match(/id=(\\d+)/);
                if (match) ids.push(parseInt(match[1]));
              });
              return ids.slice(0, 10); // ONLY FIRST 10
            });
            
            const results = [];
            for (const id of jutIds) {
              console.log('📊 Fetching JUT ' + id);
              await page.goto('https://jnanasudha.com/quiz/view_result?id=' + id);
              
              const data = await page.evaluate(() => {
                const text = document.body.innerText;
                const scoreMatch = text.match(/Total Score:\\s*(\\d+)/i);
                const rankMatch = text.match(/RANK:\\s*(\\d+)/i);
                return {
                  score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
                  rank: rankMatch ? parseInt(rankMatch[1]) : 0
                };
              });
              results.push({ id, ...data });
            }
            
            await browser.close();
            return results;
          })()
        `
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000, // 30 seconds
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch results' },
      { status: 500 }
    );
  }
}