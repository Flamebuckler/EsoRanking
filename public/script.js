async function searchAccount(name) {
	// search using the bundled static data only (no live API available)
	// load static data from data.json on first use
	if (!window.__staticData) {
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
	// split into terms by whitespace (allows multiple search words)
	const terms = name
		.trim()
		.split(/\s+/)
		.map((t) => t.replace(/^@/, '').toLowerCase())
		.filter(Boolean);
	if (window.__index) {
		const seen = new Set();
		for (const query of terms) {
			// exact key match first
			if (window.__index.has(query)) {
				for (const item of window.__index.get(query)) {
					const key = JSON.stringify(item);
					if (!seen.has(key)) {
						seen.add(key);
						results.push(item);
					}
				}
			}
			// substring matches
			for (const [key, arr] of window.__index) {
				if (key.includes(query) && key !== query) {
					for (const item of arr) {
						const key2 = JSON.stringify(item);
						if (!seen.has(key2)) {
							seen.add(key2);
							results.push(item);
						}
					}
				}
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
				for (const query of terms) {
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
	}
	return results;
}

function displayResults(results) {
	const container = document.getElementById('results');
	if (!container) {
		console.warn('results container not found; aborting display');
		return;
	}
	// ensure the section is visible on search
	container.style.display = '';
	container.classList.remove('hidden');
	container.innerHTML = '';
	if (!results || results.length === 0) {
		const empty = document.createElement('div');
		empty.className = 'empty';
		empty.textContent = 'No entries found';
		container.appendChild(empty);
		return;
	}
	// sort results: region, leaderboard, rank (numeric), then account
	results.sort((a, b) => {
		const r = a.region.localeCompare(b.region);
		if (r !== 0) return r;
		const l = a.leaderboard.localeCompare(b.leaderboard);
		if (l !== 0) return l;
		const rk = Number(a.rank) - Number(b.rank);
		if (rk !== 0) return rk;
		return (a.account || '').localeCompare(b.account || '');
	});

	const table = document.createElement('table');
	table.className = 'results-table';
	const thead = document.createElement('thead');
	thead.innerHTML = `
		<tr>
			<th>Leaderboard</th>
			<th>Region</th>
			<th>Rang</th>
			<th>Account</th>
			<th>Char</th>
		</tr>
	`;
	table.appendChild(thead);
	const tbody = document.createElement('tbody');
	for (const r of results) {
		const tr = document.createElement('tr');
		const acct = r.account || '';
		const ch = r.character || '';
		tr.innerHTML = `
			<td>${escapeHtml(r.leaderboard)}</td>
			<td>${escapeHtml(r.region.toUpperCase())}</td>
			<td>${escapeHtml(String(r.rank))}</td>
			<td>${escapeHtml(acct)}</td>
			<td>${escapeHtml(ch)}</td>
		`;
		tbody.appendChild(tr);
	}
	table.appendChild(tbody);
	container.appendChild(table);
}

function escapeHtml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

const searchBtn = document.getElementById('search');
const input = document.getElementById('account');
async function doSearch() {
	const name = input.value.trim();
	if (!name) return;
	searchBtn.disabled = true;
	searchBtn.setAttribute('aria-busy', 'true');
	try {
		const results = await searchAccount(name);
		displayResults(results);
	} finally {
		searchBtn.disabled = false;
		searchBtn.removeAttribute('aria-busy');
	}
}

if (searchBtn && input) {
	searchBtn.addEventListener('click', doSearch);
	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') doSearch();
	});
} else {
	console.warn('search button or input not found, listeners not attached');
}
