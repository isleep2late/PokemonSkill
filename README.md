# PokemonSkill v0.03 Beta

A Discord bot for ranking 1v1 Pokémon battles — both **Pokémon TCG Pocket** and **Pokémon Showdown** — using [OpenSkill](https://github.com/philihp/openskill.js) (Weng-Lin Bayesian Rating).

PokemonSkill is a fork of [cEDHSkill](https://github.com/isleep2late/cEDHSkill) adapted from a 4-player free-for-all rating system to a 1v1 ladder. Decks and teams are registered as **free-form names** — there's no external database lookup, so anything works ("Mewtwo Hyper Offense", "All Psychic", "Charizard ex Pocket", "Misty Starmie").

## What's different from cEDHSkill

| Feature | cEDHSkill | PokemonSkill |
| --- | --- | --- |
| Match size | Exactly 4 players | Exactly 2 players (1v1) |
| Valid outcomes | 1 winner + 3 losers, or 4 draws | 1 winner + 1 loser, or 2 draws |
| Turn order | 1–4 (seat at the pod) | 1 (went first) or 2 (went second) |
| Deck/team names | Validated against EDHREC | **Free-form** — register any name |
| Phantom opponents | 3 phantoms | 1 phantom |
| Target games | cEDH Magic | Pokémon TCG Pocket, Pokémon Showdown |

Everything else — OpenSkill rating math, sigma-based rating decay, undo/redo, snapshots, audit logs, the suspicion checker, the `/timewalk` admin tool, season reset (`/thanossnap`), participation bonuses, and the Elo formula `Elo = 1000 + 25 * (mu - 3 * sigma)` — is preserved.

## Features

- **Dual Rating Systems** — Separate rankings for **players** and **decks/teams**
- **OpenSkill-Based Elo** — `Elo = 1000 + 25 * (mu - 3 * sigma)`
- **Free-Form Deck/Team Names** — register *any* name (TCG Pocket decks like "All Psychic" or Showdown teams like "Mewtwo Hyper Offense")
- **1v1 Format** — exactly 2 players per match; outcomes are P1 wins / P2 wins / draw
- **Turn Order Tracking** — optional `1` (went first) vs `2` (went second) per game; per-player and per-deck turn-order win-rates
- **Participation Bonus** — +1 Elo per ranked game (max 5 per day per player/deck)
- **Rating Decay** — sigma-based inactivity decay (-1 Elo/day after 6 days; floors at 1050 Elo). Increases uncertainty rather than reducing the skill estimate, so returning players reconverge quickly.
- **Game Injection** — admins can splice historical games anywhere in the timeline; ratings recalculate chronologically
- **Undo/Redo** — full operation history covering games, manual `/set` adjustments, and decay cycles
- **Suspicious Activity Detection** — automated pattern detection (win streaks, rapid wins, repeated opponents)
- **Backups & Season Reset** — `/backup` exports the database via DM; `/thanossnap` ends a season

## Setup

1. Clone the repository.
2. `npm install`
3. Copy `.env.example` to `.env` and fill in:
   - `DISCORD_TOKEN` — your bot token from the Discord Developer Portal
   - `CLIENT_ID` — your application's client ID
   - `GUILD_ID` — your Pokémon server's guild ID
   - `ADMINS` — comma-separated admin Discord user IDs
   - `MODERATORS` — comma-separated moderator IDs (optional)
   - `DECAY_START_DAYS` — days before decay begins (default `6`)
4. `npm run build`
5. `npm run commands:register`
6. Start the bot using one of the launch scripts (`start-leaguebot.sh` / `.command` / `.bat`) or via `npm start`.

> **Optional:** Grant the bot **Manage Messages** permission in your Discord server to allow automatic reaction cleanup during turn-order selection. The bot still works without it; players just have to remove their own old reactions when changing turn-order picks.

## Submitting matches

### Player game (most common)

```
/rank results: @P1 w @P2 l
```

With deck/team names attached:

```
/rank results: @P1 mewtwo-hyper-offense w @P2 all-psychic l
```

Add turn order inline (`1` = went first, `2` = went second):

```
/rank results: @P1 1 w @P2 2 l
```

A draw:

```
/rank results: @P1 d @P2 d
```

### Deck-only game (no @users)

When no player is mentioned, `/rank` runs in **deck-only mode**. Order matters — first entry went first, second went second:

```
/rank results: mewtwo-hyper-offense w all-psychic l
```

### Default deck/team

Set your default deck/team so it auto-attaches to future games:

```
/set deck:mewtwo-hyper-offense
```

Remove it with `/set deck:nocommander`.

## Valid outcomes

PokemonSkill enforces three legal 1v1 outcomes only:

1. **P1 wins, P2 loses** — `1w + 1l`
2. **P1 loses, P2 wins** — `1w + 1l` with positions swapped
3. **Draw** — `2d`

Any other combination (`2w`, `2l`, `1w + 1d`, etc.) is rejected.

## Command list

| Command | Purpose |
| --- | --- |
| `/rank` | Submit a 1v1 game (player or deck-only mode) |
| `/predict` | Win-probability prediction; with no input shows league-wide turn-order stats |
| `/view` | League stats, player stats, deck/team stats, or single-game details |
| `/list` | Top-N rankings (players or decks/teams), with qualification status |
| `/print` | Admin: export full history / per-player history / decay logs / etc. |
| `/set` | Admin: manual rating adjustments, deck/team assignment, game edits |
| `/undo` / `/redo` | Admin: revert / reapply the most recent operation |
| `/snap` | Admin: clean up unconfirmed game messages |
| `/thanossnap` | Admin: end-of-season backup + reset |
| `/backup` | Admin: download database backup via DM |
| `/restrict` / `/vindicate` / `/reanimate` | Admin: ban / unban / suspicion-exempt management |
| `/timewalk` | Admin: simulate elapsed days for testing decay |
| `/help [section]` | In-bot help — `info`, `player`, `deck`, `stats`, `admin`, `tips`, `credits` |

## Rating system

PokemonSkill uses [OpenSkill](https://github.com/philihp/openskill.js)'s Plackett-Luce model. Each player has a Bayesian skill estimate `mu` and an uncertainty `sigma`. The displayed Elo is

```
Elo = 1000 + 25 * (mu - 3 * sigma)
```

After each match, OpenSkill updates both players' `mu`/`sigma` based on the outcome. A 1v1 match is fed in as two teams of one player each, with ranks `[1, 2]` for a decisive game or `[1, 1]` for a draw.

**Decay** is sigma-based: after 6 days of inactivity (configurable via `DECAY_START_DAYS`), a player loses 1 Elo per day **by increasing sigma**, not by lowering mu. This means inactivity decreases confidence in the rating rather than damaging the skill estimate, so returning players reconverge quickly. Decay floors at 1050 Elo.

**Participation bonus**: every ranked game grants +1 Elo (capped at 5/day) for both player and assigned deck/team.

## TCG Pocket vs. Showdown

PokemonSkill doesn't enforce any naming convention — the same bot can rank both communities side-by-side. Suggested patterns:

- **TCG Pocket decks** — use the deck archetype: `all-psychic`, `charizard-ex`, `mewtwo-ex`, `pikachu-ex`, `gyarados-ex`
- **Showdown teams** — use the team's identity or signature mon: `mewtwo-hyper-offense`, `kyogre-rain`, `groudon-sand`, `tapu-lele-screens`

Names are normalized to lowercase with hyphens (e.g. `Mewtwo Hyper Offense` → `mewtwo-hyper-offense`) so capitalization and spacing don't fragment ratings.

## Running the bot

### Quick start (double-click)

| OS | File | How |
|----|------|-----|
| **Linux** | `start-leaguebot.desktop` | Double-click in your file manager — opens a terminal window automatically |
| **macOS** | `start-leaguebot.command` | Double-click in Finder — a Terminal window opens automatically |
| **Windows** | `start-leaguebot.bat` | Double-click in File Explorer — a Command Prompt window opens automatically |

> **Linux note:** Edit the `.desktop` file in a text editor and replace `"$(dirname "%k")"` with your actual project folder, otherwise the launcher won't know where to start.

### Terminal

```bash
# Linux / macOS
./start-leaguebot.sh            # Build + run (output visible in terminal + log file)
./start-leaguebot.sh --no-build # Skip build, just run
./start-leaguebot.sh --bg       # Run in background via screen (detachable)

# Windows
start-leaguebot.bat
```

Or directly:

```bash
npm run build
npm start
```

## Project layout

```
src/
├── bot.ts                      # Discord client, decay scheduler, timewalk virtual clock
├── loader.ts                   # DB initialization entry point
├── config.ts                   # Env-var-driven configuration
├── register-commands.ts        # Slash-command registration
├── clear-other-servers.ts      # Cleanup tool for old guild registrations
├── db/
│   ├── init.ts                 # SQLite schema (data/PokemonSkill.db)
│   ├── player-utils.ts         # Player CRUD + rating updates
│   ├── deck-utils.ts           # Deck/team CRUD + rating updates
│   ├── match-utils.ts          # Match recording & lookup
│   └── database-utils.ts       # Migrations, cleanup, bot-config
├── utils/
│   ├── elo-utils.ts            # mu/sigma ↔ Elo conversion
│   ├── edhrec-utils.ts         # Free-form deck/team name normalization (no external lookup)
│   ├── snapshot-utils.ts       # Undo/redo serialization
│   ├── rating-audit-utils.ts   # Audit trail
│   ├── suspicion-utils.ts      # Anti-cheat exempt list
│   ├── game-id-utils.ts        # Unique game IDs
│   ├── player-deck-assignments.ts
│   └── logger.ts
└── commands/                   # One file per slash command
```

Database lives at `data/PokemonSkill.db` (SQLite).

## Credits

- **PokemonSkill maintainer:** [isleep2late](https://github.com/isleep2late)
- **Forked from:** [cEDHSkill](https://github.com/isleep2late/cEDHSkill) by isleep2late
- **OpenSkill rating engine:** [philihp/openskill.js](https://github.com/philihp/openskill.js)
- **Underlying research:** [Weng & Lin, "A Bayesian Approximation Method for Online Ranking"](https://www.csie.ntu.edu.tw/~cjlin/papers/online_ranking/online_journal.pdf)

Built for the **Pokémon TCG Pocket** and **Pokémon Showdown** communities. Battle on!

## License

MIT
