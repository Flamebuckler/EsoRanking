async function searchAccount(name) {
	// try live API first
	try {
		const res = await fetch(`/api/search?name=${encodeURIComponent(name)}`);
		if (res.ok) {
			return res.json();
		}
		console.warn('API returned', res.status);
	} catch (e) {
		console.warn('Live API unreachable, falling back to static data', e);
	}

	// fallback: search in data.json (used for static mode)
	if (!window.__staticData) {
		try {
			const r = await fetch('data.json');
			window.__staticData = await r.json();
		} catch (e) {
			console.error('could not load static data', e);
			return [];
		}
	}
	const results = [];
	// normalize query for comparison
	const query = name.replace(/^@/, '').toLowerCase();
	for (const [lbName, regions] of Object.entries(window.__staticData)) {
		for (const [region, entries] of Object.entries(regions)) {
			for (const entry of entries) {
				const acct = entry.account ? entry.account.replace(/^@/, '').toLowerCase() : '';
				const char = entry.character ? entry.character.replace(/^@/, '').toLowerCase() : '';
				// substring match for similarity
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
		container.textContent = 'Keine Einträge gefunden';
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
