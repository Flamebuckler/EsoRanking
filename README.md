# ESO Leaderboard Search

Dieses Projekt ist eine Webanwendung, die Elderscrolls Online Leaderboards durchsucht.
Der Benutzer kann einen Accountnamen eingeben und die Anwendung prüft, ob der Account auf den verschiedenen Leaderboards vertreten ist.

## Abläufe

- **Live‑Search‑API:** ein Express‑Server (`server.js`) startet einen kleinen HTTP‑Service. Er lädt die Seiten allerdings nur alle paar Minuten (Standard 5 Minuten) per Puppeteer, speichert die Ergebnisse im Speicher und baut zusätzlich einen schnellen Schlüssel‑Index. Suchanfragen werden dann direkt gegen diesen Cache abgearbeitet – neue Browser‑Aufrufe fallen nur an, wenn der Cache älter als `CACHE_TTL` ist. Die zu verarbeitenden Leaderboard‑URLs und Regionen (pc-eu / pc-na) werden in `config.json` definiert. Bei der Umwandlung werden Account‑ und Charakternamen aus dem HTML getrennt (`<br>`-Trennung) und getrennt gespeichert. Außerdem entfernt der Parser `<strong>`‑ und `<small>`‑Tags, die auf der Seite zur Hervorhebung verwendet werden. Die Frontend‑Seite (`public/index.html` + `public/script.js`) ruft `/api/search?name=<account>` ab.
- Das alte Scrape‑Skript (`scraper/index.js`) steht weiterhin zur Verfügung, falls Du gelegentlich einen Dump der Daten generieren möchtest, z. B. zur Analyse. Es wird nicht mehr für die Web‑App benötigt.
- **Wichtig:** GitHub Pages kann keine Node‑Server ausführen – für den Live‑Modus benötigst Du einen Hosting‑anbieter, der Node.js‑Anwendungen zulässt (Heroku, Vercel, Railway, eigener VPS, etc.).

## Entwicklung

- Node.js installieren (empfohlen 18+).
- `npm install` im Wurzelverzeichnis ausführen.
- `npm run scrape` um die Daten lokal abzurufen (speichert jetzt `account` und `character` getrennt).
- `npm run dev` um einen lokalen HTTP-Server für `public` zu starten.

## Hosting

Für statisches Hosting (gelegentliche Daten‑Dumps) kannst Du noch GitHub Pages verwenden. Der `/public`-Ordner ist dafür vorbereitet und wird von der Action erzeugt.

**Live‑Suchfunktion:** Wenn die Seite dynamisch auf die aktuellen Leaderboards zugreifen soll, musst Du den Express‑Server (`server.js`) irgendwo laufen lassen. Beispiele:

1. **Vercel/Heroku/Railway:** Deploye das gesamte Repo als Node‑App; diese Anbieter starten automatisch `npm start`.
2. **Eigener Server/VPS:** `npm install && npm start`, dann den Port in der Firewall freigeben.

Die statische Seite ist nach wie vor unter `/` verfügbar und spricht das Backend über relative Pfade (`/api/search`).

## Lizenz

MIT
