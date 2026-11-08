#!/usr/bin/env node
// Scans /games/*/ and writes games.json for the hub to read.
// Each game is a folder with an index.html and an optional game.json:
//   { "title": "Snake", "description": "...", "tags": ["arcade"], "emoji": "🐍", "color": "#2f9e5b", "thumbnail": "thumb.png" }
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const gamesDir = path.join(root, "games");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const titleCase = (s) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const games = [];
for (const entry of fs.readdirSync(gamesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = path.join(gamesDir, entry.name);
  const indexFile = path.join(dir, "index.html");
  if (!fs.existsSync(indexFile)) {
    console.warn(`Skipping ${entry.name}: no index.html`);
    continue;
  }

  let meta = {};
  const metaFile = path.join(dir, "game.json");
  if (fs.existsSync(metaFile)) {
    try { meta = JSON.parse(fs.readFileSync(metaFile, "utf8")); }
    catch (e) { console.warn(`Bad game.json in ${entry.name}: ${e.message}`); }
  }

  // Fall back to the page's <title>, then the folder name.
  const html = fs.readFileSync(indexFile, "utf8");
  const htmlTitle = (html.match(/<title>([^<]*)<\/title>/i) || [])[1];

  games.push({
    id: slug(entry.name),
    path: `games/${entry.name}/`,
    title: meta.title || (htmlTitle && htmlTitle.trim()) || titleCase(entry.name),
    description: meta.description || "",
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    emoji: meta.emoji || "🎮",
    color: meta.color || "#2f3cff",
    thumbnail: meta.thumbnail ? `games/${entry.name}/${meta.thumbnail}` : null,
  });
}

games.sort((a, b) => a.title.localeCompare(b.title));
fs.writeFileSync(path.join(root, "games.json"), JSON.stringify(games, null, 2) + "\n");
console.log(`games.json: ${games.length} game(s)`);
