const puppeteer = require('puppeteer');
(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto('https://eso-hub.com/en/leaderboards/aetherian-archive', {
		waitUntil: 'networkidle2',
	});
	await page.waitForSelector('table', { timeout: 15000 });
	const entries = await page.evaluate(() => {
		const result = [];
		const tables = document.querySelectorAll('table');
		tables.forEach((tbl, idx) => {
			let region = idx === 0 ? 'pc-eu' : 'pc-na';
			const prev = tbl.previousElementSibling;
			if (prev && /PC\s*-?\s*NA/i.test(prev.textContent)) region = 'pc-na';
			else if (prev && /PC\s*-?\s*EU/i.test(prev.textContent)) region = 'pc-eu';
			Array.from(tbl.querySelectorAll('tr')).forEach((tr) => {
				const cells = tr.querySelectorAll('td');
				if (cells.length >= 2) {
					let html = cells[1].innerHTML.trim();
					html = html.replace(/<\/?(?:strong|small)>/gi, '');
					let account = '',
						character = '';
					if (html.includes('<br')) {
						const parts = html.split(/<br\s*\/?\s*>/i).map((s) => s.trim());
						account = parts[0] || '';
						character = parts[1] || '';
					} else account = cells[1].textContent.trim();
					const rank = cells[0].textContent.trim();
					result.push({ region, rank, account, character });
				}
			});
		});
		return result;
	});
	console.log('got', entries.length, 'entries');
	console.log(entries.slice(0, 10));
	await browser.close();
})();
