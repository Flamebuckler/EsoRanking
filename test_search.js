const data = require('./public/data.json');
function search(name) {
	const q = name.replace(/^@/, '').toLowerCase();
	const results = [];
	for (const [lb, regions] of Object.entries(data)) {
		for (const [reg, entries] of Object.entries(regions)) {
			for (const entry of entries) {
				const acct = entry.account ? entry.account.replace(/^@/, '').toLowerCase() : '';
				const char = entry.character ? entry.character.replace(/^@/, '').toLowerCase() : '';
				// substring match for similarity
				if (acct.includes(q) || char.includes(q)) {
					results.push({
						lb,
						reg,
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
console.log('with @', search('@Al_duin'));
console.log('no @', search('Al_duin'));
