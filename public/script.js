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
