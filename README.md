# Krillion Answer Key: the daily fetch

The script and workflow behind [krillionanswerkey.com](https://krillionanswerkey.com/), an independent fan site that lists each day's answers to [Krillion](https://krillion.io/), the daily rarity-scored trivia game.

Krillion publishes one answer sheet a day and keeps only the current day public, so the site has to fetch it shortly after the game resets (midnight US Eastern), save it, and republish.

- `fetch.mjs` fetches the day's sheet (about 7.5 MB, over 100,000 accepted answers), keeps the 100-point answer, the small tiers in full and an evenly spread sample of the large tiers, and appends the day to a JSON file. `--probe` fetches and reports without saving.
- `examples/daily.example.yml` is the schedule: several runs after 04:00 and 05:00 UTC to cover daylight saving and late starts; a run that finds the day already saved does nothing.

The site itself is a static export; every page is generated from that JSON file.

- [Today's answers](https://krillionanswerkey.com/)
- [How Krillion scoring works](https://krillionanswerkey.com/scoring)
- [When Krillion resets (midnight US Eastern, with a live countdown)](https://krillionanswerkey.com/reset-time)
- [Answer checker, which looks an answer up in the day's full sheet](https://krillionanswerkey.com/answer-checker)
- [Archive of earlier days](https://krillionanswerkey.com/archive)

Not affiliated with Krillion or its developer. Paths inside the two files are those of the site's private repository; adjust them to use the files elsewhere.

MIT licence.
