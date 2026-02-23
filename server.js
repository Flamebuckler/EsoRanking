const express = require('express');

const app = express();
const port = process.env.PORT || 3333;

// Serve the static frontend only. The project uses a static `data.json`
// file and does not provide a live API, so no scraping or Puppeteer here.
app.use(express.static('public'));

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
