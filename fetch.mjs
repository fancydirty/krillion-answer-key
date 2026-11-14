// Saves today's Krillion answer sheet into src/sites/krillion/data/days.json.
// krillion.io publishes only the current day's sheet (the day turns over at midnight US Eastern), so this
// has to run once a day; a day that was missed cannot be fetched later. The sheet has tens of thousands of
// accepted answers per prompt; we keep the gem, the small tiers in full, and a sample of the large ones.
import { readFile, writeFile } from "node:fs/promises";

const FILE = new URL("../src/sites/krillion/data/days.json", import.meta.url);
const EPOCH = "2026-07-16"; // Daily Dive #1, from the game's own script
const KEEP = { rare: 60, deepcut: 40 };

const etDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const dayNumber = (date) => Math.round((Date.parse(date) - Date.parse(EPOCH)) / 864e5) + 1;
const slug = (text) => text.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/** n items spread evenly over the list, so a sample is not just the names that sort first. */
const spread = (list, n) => (list.length <= n ? list : Array.from({ length: n }, (_, i) => list[Math.floor((i * list.length) / n)]));

// `--probe` fetches and reports without saving: a way to check from CI that krillion.io still answers.
const probe = process.argv.includes("--probe");
const date = process.argv.slice(2).find((a) => /^\d{4}-\d\d-\d\d$/.test(a)) || etDate();
const days = JSON.parse(await readFile(FILE, "utf8").catch(() => "[]"));
if (!probe && days.some((d) => d.date === date)) {
  console.log(`krillion ${date}: already saved`);
  process.exit(0);
}

const res = await fetch(`https://krillion.io/api/reveal?date=${date}`, { headers: { "user-agent": "krillionanswerkey.com daily fetch (hello@krillionanswerkey.com)" } });
if (!res.ok) {
  console.error(`krillion ${date}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  process.exit(1);
}
const sheet = await res.json();
if (sheet.date !== date || !Array.isArray(sheet.prompts) || sheet.prompts.length === 0) {
  console.error(`krillion ${date}: unexpected sheet`);
  process.exit(1);
}

if (probe) {
  console.log(`krillion ${date}: reachable, ${sheet.prompts.length} prompts, ${sheet.prompts.reduce((n, p) => n + p.answers.length, 0)} answers`);
  process.exit(0);
}

const prompts = sheet.prompts.map((p) => {
  const by = (tier) => p.answers.filter((a) => a.tier === tier);
  const names = (tier) => by(tier).map((a) => a.answer);
  const readable = (list) => list.filter((a) => /^[A-Za-z]/.test(a));
  const gem = by("krillion")[0];
  return {
    text: p.text,
    slug: slug(p.text),
    total: p.answers.length,
    counts: Object.fromEntries(["plankton", "tooclever", "schooler", "rare", "deepcut", "krillion"].map((t) => [t, by(t).length])),
    krillion: gem ? { answer: gem.answer, quip: gem.quip ?? null } : null,
    tooclever: by("tooclever").map((a) => ({ answer: a.answer, quip: a.quip ?? null })),
    plankton: names("plankton"),
    schooler: names("schooler"),
    rare: spread(readable(names("rare")), KEEP.rare),
    deepcut: spread(readable(names("deepcut")), KEEP.deepcut),
  };
});

days.push({ date, number: dayNumber(date), prompts });
days.sort((a, b) => a.date.localeCompare(b.date));
await writeFile(FILE, JSON.stringify(days, null, 1) + "\n");
console.log(`krillion ${date}: saved Daily Dive #${dayNumber(date)}, ${prompts.length} prompts`);
