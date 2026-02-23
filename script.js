async function searchAccount(name) {
	// search using the bundled static data only (no live API available)
	// load static data from data.json on first use
	if (!window.__staticData) {
		console.log('Loading static data from data.json...');
		try {
			const r = await fetch('data.json');
			window.__staticData = await r.json();
			// build index
			window.__index = new Map();
			for (const [lbName, regions] of Object.entries(window.__staticData)) {
				for (const [region, entries] of Object.entries(regions)) {
					for (const entry of entries) {
						const acct = entry.account ? entry.account.replace(/^@/, '').toLowerCase() : '';
						const char = entry.character ? entry.character.replace(/^@/, '').toLowerCase() : '';
						[acct, char].forEach((key) => {
							if (!key) return;
							if (!window.__index.has(key)) window.__index.set(key, []);
							window.__index.get(key).push({
								leaderboard: lbName,
								region,
								rank: entry.rank,
								account: entry.account,
								character: entry.character,
							});
						});
					}
				}
			}
		} catch (e) {
			console.error('could not load static data', e);
			return [];
		}
	}
	// perform lookup via index if available
	const results = [];
	const query = name.replace(/^@/, '').toLowerCase();
	if (window.__index) {
		// exact key match first
		if (window.__index.has(query)) {
			results.push(...window.__index.get(query));
		}
		// also add substring matches (iterate keys or use scan)
		for (const [key, arr] of window.__index) {
			if (key.includes(query) && key !== query) {
				results.push(...arr);
			}
		}
		return results;
	}
	// fallback linear scan if index missing (shouldn't happen)
	for (const [lbName, regions] of Object.entries(window.__staticData)) {
		for (const [region, entries] of Object.entries(regions)) {
			for (const entry of entries) {
				const acct = entry.account ? entry.account.replace(/^@/, '').toLowerCase() : '';
				const char = entry.character ? entry.character.replace(/^@/, '').toLowerCase() : '';
				if (acct.includes(query) || char.includes(query)) {
					results.push({
						leaderboard: lbName,
						region,
						rank: entry.rank,
						account: entry.account,
						character: entry.character,
					});
					break;
				}
			}
		}
	}
	return results;
}

function displayResults(results) {
	const container = document.getElementById('results');
	container.innerHTML = '';
	if (results.length === 0) {
		container.textContent = 'No entries found';
		return;
	}
	const ul = document.createElement('ul');
	for (const r of results) {
		const li = document.createElement('li');
		let text = `${r.leaderboard} (${r.region.toUpperCase()}): Rang ${r.rank}`;
		if (r.account || r.character) {
			text += ' – ';
			if (r.account) text += `Account: ${r.account}`;
			if (r.character) text += r.account ? `, Char: ${r.character}` : `Char: ${r.character}`;
		}
		li.textContent = text;
		ul.appendChild(li);
	}
	container.appendChild(ul);
}

document.getElementById('search').addEventListener('click', async () => {
	const name = document.getElementById('account').value.trim();
	if (!name) return;
	const results = await searchAccount(name);
	displayResults(results);
});
