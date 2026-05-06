# Finishing Setup

This branch is **functionally complete except for three files** that couldn't
be transmitted reliably through the bot's tool-call mechanism due to size.
The full byte-perfect versions of all three files exist in the
[cEDHSkill source repo](https://github.com/isleep2late/cEDHSkill) (which this
project forks from) and need to be ported across with a small set of
documented patches before the bot will run.

## What's missing on this branch

| File | Status | Required for |
|---|---|---|
| `src/commands/rank.ts` | **MISSING** | The `/rank` slash command (core 1v1 match recording) |
| `src/commands/set.ts` | **MISSING** | The `/set` admin command (rating overrides, deck assignments) |
| `package-lock.json` | **MISSING** | Reproducible installs (`npm install` regenerates it) |

A fourth file, `src/commands/print.ts`, is present but has minor cosmetic
corruption in the box-drawing characters and one emoji glyph in admin export
output. The code logic is correct; only the visual formatting of the exported
report is affected.

## Steps to complete the port

### 1. Pull the missing files from cEDHSkill

```bash
git clone https://github.com/isleep2late/cEDHSkill.git /tmp/cEDHSkill-source
cp /tmp/cEDHSkill-source/src/commands/rank.ts ./src/commands/rank.ts
cp /tmp/cEDHSkill-source/src/commands/set.ts ./src/commands/set.ts
```

### 2. Apply the PokemonSkill patches to `rank.ts`

Open `src/commands/rank.ts` and apply these changes (line numbers approximate):

#### a. `InputValidator` class (around line 95)

```diff
-  static validateTurnOrder(turnOrder: number, maxPlayers: number = 4): boolean {
+  static validateTurnOrder(turnOrder: number, maxPlayers: number = 2): boolean {
```

```diff
-  static validatePlayerCount(count: number, isCEDHMode: boolean = true): boolean {
-    if (isCEDHMode) {
-      return count === 4; // cEDH mode requires exactly 4 players
-    }
-    return count >= 2 && count <= 4;
-  }
+  static validatePlayerCount(count: number, _isCEDHMode: boolean = true): boolean {
+    // PokemonSkill is strictly 1v1.
+    return count === 2;
+  }

-  static validateDeckCount(count: number): boolean {
-    return count >= 3 && count <= 4;
-  }
+  static validateDeckCount(count: number): boolean {
+    // 1v1 deck-vs-deck matches.
+    return count === 2;
+  }
```

In `validateResultCombination`, replace the cEDH 1w+3l / 4d rules with 1v1
1w+1l / 2d (see `validateResultCombination` body).

In `validateTurnOrders` change the error message from "1 and 4" to
"1 (went first) or 2 (went second)".

#### b. Replace `CommanderValidator` class (around line 215)

The entire ~90-line class that does EDHREC HTTP validation should be replaced
with a stub that only validates the format:

```typescript
class CommanderValidator {
  static async validateCommander(commanderName: string): Promise<{ valid: boolean; error?: string }> {
    if (!InputValidator.validateCommanderName(commanderName)) {
      return { valid: false, error: 'Invalid deck/team name. Use 2–100 letters, digits, spaces, hyphens, apostrophes, commas, or periods.' };
    }
    return { valid: true };
  }
}
```

#### c. Turn-order emoji array (4 occurrences)

Find `const turnOrderEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];` and replace with
`const turnOrderEmojis = ['1️⃣', '2️⃣'];` everywhere (4 occurrences). Also
update `validEmojis` from `['👍', '❌', '1️⃣', '2️⃣', '3️⃣', '4️⃣']` to
`['👍', '❌', '1️⃣', '2️⃣']`.

#### d. Smart turn-order deduction (around line 1314)

```diff
-  if (playersWithTurnOrder.length === 3 && players.length === 4) {
-    const providedTurnOrders = new Set(playersWithTurnOrder.map(p => p.turnOrder!));
-    const allTurnOrders = [1, 2, 3, 4];
-    const missingTurnOrder = allTurnOrders.find(t => !providedTurnOrders.has(t));
-    if (missingTurnOrder) {
-      const playerWithoutTurnOrder = players.find(p => p.turnOrder === undefined);
-      if (playerWithoutTurnOrder) playerWithoutTurnOrder.turnOrder = missingTurnOrder;
-    }
-  }
+  if (playersWithTurnOrder.length === 1 && players.length === 2) {
+    const provided = playersWithTurnOrder[0].turnOrder!;
+    const missingTurnOrder = provided === 1 ? 2 : 1;
+    const playerWithoutTurnOrder = players.find(p => p.turnOrder === undefined);
+    if (playerWithoutTurnOrder) playerWithoutTurnOrder.turnOrder = missingTurnOrder;
+  }
```

#### e. cEDH mode block (around line 1340)

Replace the 4-player enforcement and result validation with 1v1 rules:

```diff
-    if (numPlayers !== 4) {
-      await interaction.editReply({ content: '⚠️ Only 4-player games are supported in cEDH mode.' });
+    if (numPlayers !== 2) {
+      await interaction.editReply({ content: '⚠️ PokemonSkill only supports 1v1 (2-player) games.' });
       return;
     }
```

```diff
-      if (providedTurnOrders.some(t => t < 1 || t > 4)) {
-        await interaction.editReply({ content: '⚠️ Turn order numbers must be between 1 and 4.' });
+      if (providedTurnOrders.some(t => t < 1 || t > 2)) {
+        await interaction.editReply({ content: '⚠️ Turn order must be 1 (went first) or 2 (went second).' });
       return;
     }
```

```diff
-if (winCount === 1 && lossCount === 3 && drawCount === 0) { /* valid */ }
-else if (winCount === 0 && lossCount === 0 && drawCount === 4) { /* valid */ }
-else {
-  await interaction.editReply({ content: '⚠️ Invalid result combination for cEDH format. Must be either: 1 winner + 3 losers, or 4 draws.' });
-  return;
-}
+if (winCount === 1 && lossCount === 1 && drawCount === 0) { /* valid */ }
+else if (winCount === 0 && lossCount === 0 && drawCount === 2) { /* valid */ }
+else {
+  await interaction.editReply({ content: '⚠️ Invalid result combination for 1v1 format. Must be either: 1 winner + 1 loser, or 2 draws.' });
+  return;
+}
```

#### f. EDHREC commander validation in player game (around line 1413)

Remove the EDHREC validation loop and replace error message with format
validation only. The existing `CommanderValidator.validateCommander` stub
(applied above in step b) handles the new message — just update the error
text to:

```typescript
content: `⚠️ Invalid deck/team name format: ${invalidNames}\n` +
         'Names must be 2–100 characters using letters, digits, spaces, hyphens, apostrophes, commas, or periods.'
```

#### g. Deck-only mode (around line 2180)

Change the format message:

```diff
-      content: '⚠️ Invalid format for deck-only mode. Use: `commander-name w/l/d commander-name w/l/d ...`\n' +
-               'Example: `atraxa-praetors-voice l edgar-markov w kaalia-of-the-vast l edgar-markov w`\n' +
-               'Note: Duplicate commanders are allowed.'
+      content: '⚠️ Invalid format for deck-only mode. Use: `deck-name w/l/d deck-name w/l/d`\n' +
+               'Example: `mewtwo-hyper-offense w all-psychic l`\n' +
+               'Note: deck-vs-deck mode is 1v1 (exactly two entries).'
```

Also enforce `tokens.length !== 4` (instead of `< 2 || % 2 !== 0`) so we
require exactly two deck entries.

Replace the deck-count validation with `decks.length !== 2` and the result
validation with the same 1w+1l / 2d rules used for player mode. Remove the
EDHREC validation loop just like in (f).

#### h. User-facing string updates

- `Description` of the `/rank` slash command: change to
  `'Submit a 1v1 game result — players, decks/teams, or both!'`
- Help text mentioning "commander names" → "deck/team names"
- Token-error message line should reference "1-2" not "1-4"
- Embed title `'🎃 Updated Top 50 Decks'` → `'🎃 Updated Top 50 Decks/Teams'`
- Footer note `'🎃 **Commanders Assigned:**'` → `'🎃 **Decks/Teams Assigned:**'`
- Per-player `'Commander: ${p.commander}'` → `'Deck/Team: ${p.commander}'`
- Pending-confirmation embed should reference 1️⃣/2️⃣ + "went first/second"
  and example `/rank @player1 1 w @player2 2 l`

### 3. Apply the PokemonSkill patches to `set.ts`

#### a. Remove the EDHREC error blocks in the catch handler (around line 220)

Delete these two `if` blocks that match `'not a valid commander name according to EDHREC'`.

#### b. Result-validation in admin game-edit (around line 845)

```diff
-  if (finalResults.length !== 4) {
-    throw new Error(`Invalid player count: ${finalResults.length}. Player games require exactly 4 players.`);
-  }
+  if (finalResults.length !== 2) {
+    throw new Error(`Invalid player count: ${finalResults.length}. PokemonSkill is 1v1 — exactly 2 players.`);
+  }

-  const isValid = (winCount === 1 && lossCount === 3 && drawCount === 0) ||
-                  (winCount === 0 && lossCount === 0 && drawCount === 4);
-  if (!isValid) {
-    throw new Error(`Invalid result combination: ${winCount}w/${lossCount}l/${drawCount}d. Must be either: 1 winner + 3 losers, or 4 draws.`);
-  }
+  const isValid = (winCount === 1 && lossCount === 1 && drawCount === 0) ||
+                  (winCount === 0 && lossCount === 0 && drawCount === 2);
+  if (!isValid) {
+    throw new Error(`Invalid result combination: ${winCount}w/${lossCount}l/${drawCount}d. Must be either: 1 winner + 1 loser, or 2 draws.`);
+  }
```

#### c. Remove EDHREC validation in `setDeckRating` (around line 1465)

Delete the `try { validateCommander(...) }` block; free-form names are accepted as-is.

#### d. Remove EDHREC validation in `assignDeckToPlayer` (around line 1700)

Delete the `if (deckName !== 'nocommander') { try { validateCommander(...) } }` block.

#### e. Embed title

Change `'Commander Rating Updated'` → `'Deck/Team Rating Updated'`.

### 4. Regenerate `package-lock.json`

```bash
npm install
```

This recreates the lockfile based on `package.json`. (Optional but recommended
for reproducible builds.)

### 5. Verify it compiles

```bash
npm run build
```

Should produce no TypeScript errors.

### 6. Commit and push

```bash
git add src/commands/rank.ts src/commands/set.ts package-lock.json
git commit -m "Apply PokemonSkill patches to rank.ts and set.ts; regenerate lockfile"
git push origin claude/pokemon-skill-rating-fhKHS
```

## Why this is necessary

The bot agent that generated this branch transmits files through tool-call
JSON parameters. For source files larger than ~40 KB with mixed Unicode
content (emoji, runs of box-drawing characters), byte-for-byte fidelity isn't
guaranteed across that boundary. `rank.ts` (3250 lines / 121 KB) and `set.ts`
(1842 lines / 67 KB) exceed that threshold. The bot has no GitHub auth token
in its environment to bypass via `git push` directly.

Once steps 1–6 are completed, the repository is fully functional and matches
the design described in `README.md`.
