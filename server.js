const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3333;

// load configuration; contains `leaderboards` array and `regions` whitelist
const { leaderboards, regions } = require('./config.json');

async function checkAccountOnPage(page, name) {
	// remove leading @ and lowercase query
	const normalized = name.replace(/^@/, '').toLowerCase();
	return page.evaluate(
		(n, leaderboardsLocal, regionsLocal) => {
			const matches = [];
			const tables = Array.from(document.querySelectorAll('table'));
			tables.forEach((tbl, idx) => {
				let region = idx === 0 ? 'pc-eu' : 'pc-na';
				const prev = tbl.previousElementSibling;
				if (prev && /PC\s*-?\s*NA/i.test(prev.textContent)) {
					region = 'pc-na';
				} else if (prev && /PC\s*-?\s*EU/i.test(prev.textContent)) {
					region = 'pc-eu';
				}
				if (!regionsLocal.includes(region)) return;

				Array.from(tbl.querySelectorAll('tr')).forEach((tr) => {
					const cells = tr.querySelectorAll('td');
					if (cells.length >= 2) {
						const rank = cells[0].textContent.trim();
						let html = cells[1].innerHTML.trim();
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
						const acctNorm = account.replace(/^@/, '').toLowerCase();
						const charNorm = character.replace(/^@/, '').toLowerCase();
						if (acctNorm === n || charNorm === n) {
							matches.push({ rank, region, account, character });
						}
					}
				});
			});
			return matches;
		},
		normalized,
		leaderboards,
		regions,
	);
}

let sharedBrowser;

app.get('/api/search', async (req, res) => {
	const { name } = req.query;
	if (!name) {
		return res.status(400).json({ error: 'name query parameter required' });
	}

	// start browser lazily and reuse between requests
	if (!sharedBrowser) {
		sharedBrowser = await puppeteer.launch();
	}

	const results = [];
	for (const lb of leaderboards) {
		const page = await sharedBrowser.newPage();
		await page.goto(lb.url, { waitUntil: 'networkidle2' });
		try {
			await page.waitForSelector('table', { timeout: 15000 });
		} catch (_) {
			console.warn('no table found on', lb.url);
		}

		const found = await checkAccountOnPage(page, name);
		found.forEach((f) =>
			results.push({
				leaderboard: lb.name,
				region: f.region,
				rank: f.rank,
				account: f.account,
				character: f.character,
			}),
		);
		await page.close();
	}

	res.json(results);
});

// close browser when node exits
process.on('exit', () => {
	if (sharedBrowser) sharedBrowser.close();
});

// serve static frontend
app.use(express.static('public'));

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
