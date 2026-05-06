# Finishing Setup

The repository is now **fully standalone**. `src/commands/rank.ts` and
`src/commands/set.ts` are committed directly to this branch — no patching from
upstream cEDHSkill is required.

## What's still optional

| File | Status | Notes |
|---|---|---|
| `src/commands/rank.ts` | **PRESENT** | Direct push, byte-perfect |
| `src/commands/set.ts` | **PRESENT** | Direct push, byte-perfect |
| `package-lock.json` | **NOT TRACKED** | Run `npm install` once to generate it (the launcher scripts do this automatically) |

A note about `src/commands/print.ts`: it is present and the code logic is
correct. There may be minor cosmetic differences in box-drawing characters and
one emoji glyph in admin export output relative to upstream cEDHSkill, but
this only affects the visual formatting of the exported report — gameplay is
unaffected.

## Steps to run the bot

### 1. Install dependencies

```bash
npm install
```

(The launchers `start-leaguebot.sh` / `.command` / `.bat` will do this for you
the first time they run.)

### 2. Configure your `.env`

Copy `.env.example` to `.env` and fill in your Discord bot token and admin
user IDs.

### 3. Verify it compiles

```bash
npm run build
```

Should produce no TypeScript errors.

### 4. Start the bot

```bash
./start-leaguebot.sh        # Linux / macOS
start-leaguebot.command     # macOS double-click
start-leaguebot.bat         # Windows
```

That's it — the repository is functional out of the box and matches the design
described in `README.md`.
