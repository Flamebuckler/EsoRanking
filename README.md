# ESO Ranking

Welcome to ESO Ranking — a tiny app to help you quickly find a player's placement on Elder Scrolls Online leaderboards.

Just open the site and type an account name to see where that player ranks.

## Styles

This project now builds its stylesheet from SCSS. It uses the shared style repository `github:flamebuckler/styles` as a dependency; the import appears in `public/styles.scss`.

To compile the CSS you can run:

```sh
npm run build:css    # generates public/styles.css
npm run watch:css    # recompiles on changes during development
```

The shared library exports color and spacing tokens, base elements, components and utilities. Custom rules live after the import and may reference tokens such as `--color-flame-bg` or `--space-lg`.

As the central stylesheet gets updated, the local `public/styles.scss` should be checked for duplicate rules and trimmed. Most selectors (cards, forms, tables, resets, utilities etc.) are provided upstream, so the project file only needs the minimal theme overrides and any bespoke layout tweaks. This makes it painless to pull in the latest version of `flamebuckler/styles` without conflicting declarations.

[https://github.com/Flamebuckler/EsoRanking](https://flamebuckler.github.io/EsoRanking/)

Data source: leaderboard data is provided by eso-hub.com; all rights to the data belong to eso-hub.com.
