const fs = require('fs');
const puppeteer = require('puppeteer');

// Configuration is stored in config.json; we load it here so the
// same settings can be shared with server.js.
// (this script ist nur für gelegentliche Dumps; die Live‑API benutzt server.js)
const { leaderboards, regions } = require('../config.json');

/**
 * Render a leaderboard page and extract rows from the two tables (PC‑EU & PC‑NA).
 * Returns an object `{ 'pc-eu': [...], 'pc-na': [...] }`.
 */
async function fetchLeaderboard(url) {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: 'networkidle2' });
	// Warte auf mindestens ein Tabellen-Element, damit das JS gerendert hat
	await page.waitForSelector('table', { timeout: 15000 });

	const result = await page.evaluate(() => {
		const output = { 'pc-eu': [], 'pc-na': [] };
		const tables = Array.from(document.querySelectorAll('table'));

		// Die Seite verwendet zwei Tabellen; wir entscheiden uns nach Position
		// oder anhand der Überschrift direkt davor.
		tables.forEach((tbl, idx) => {
			let region = idx === 0 ? 'pc-eu' : 'pc-na';
			// versuchen, aus dem vorherigen Element etwas zu lesen
			const prev = tbl.previousElementSibling;
			if (prev && /PC\s*-?\s*NA/i.test(prev.textContent)) {
				region = 'pc-na';
			} else if (prev && /PC\s*-?\s*EU/i.test(prev.textContent)) {
				region = 'pc-eu';
			}

			Array.from(tbl.querySelectorAll('tr')).forEach((tr) => {
				const cells = tr.querySelectorAll('td');
				if (cells.length >= 2) {
					const rank = cells[0].textContent.trim();
					// account and character separated by <br>
					let html = cells[1].innerHTML.trim();
					// remove strong/small tags which may wrap portions of the name
					html = html.replace(/<\/?(?:strong|small)>/gi, '');
					let account = '';
					let character = '';
					if (html.includes('<br')) {
						const parts = html.split(/<br\s*\/?\s*>/i).map((s) => s.trim());
						account = parts[0] || '';
						character = parts[1] || '';
					} else {
						account = cells[1].textContent.trim();
					}
					// strip leading @ to ease search
					account = account.replace(/^@/, '');
					if (account) output[region].push({ rank, account, character });
				}
			});
		});
		return output;
	});

	await browser.close();

	// filter by configured regions
	Object.keys(result).forEach((reg) => {
		if (!regions.includes(reg)) {
			delete result[reg];
		}
	});

	return result;
}

async function main() {
	const result = {};
	for (const lb of leaderboards) {
		console.log(`Fetching ${lb.name}...`);
		const entries = await fetchLeaderboard(lb.url);
		result[lb.name] = entries;
	}

	// Save to public/data.json
	fs.writeFileSync('public/data.json', JSON.stringify(result, null, 2));
	console.log('Data written to public/data.json');
}

if (require.main === module) {
	main();
}
