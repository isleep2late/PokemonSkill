import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { config } from './config.js';

const rest = new REST({ version: '10' }).setToken(config.token);

// Guild IDs of servers where we want to remove PokemonSkill commands.
// Edit this list to match servers the bot has previously been registered to,
// other than your primary GUILD_ID (which is preserved).
const otherServers: Array<{ id: string; name: string }> = [
  // { id: '0000000000000000000', name: 'Old Test Server' }
];

(async () => {
  try {
    if (otherServers.length === 0) {
      console.log('\nℹ️  No "otherServers" configured. Edit src/clear-other-servers.ts to add server IDs.\n');
      return;
    }

    console.log('\n🧹 Cleaning up PokemonSkill commands from other servers...\n');

    for (const server of otherServers) {
      console.log(`Clearing commands from: ${server.name}`);
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, server.id),
        { body: [] }
      );
      console.log(`✅ Cleared commands from ${server.name}\n`);
    }

    console.log('🎉 Cleanup complete! PokemonSkill commands removed from listed servers.');
    console.log('💡 PokemonSkill commands now only appear in your primary GUILD_ID.\n');

  } catch (error) {
    console.error('❌ Error clearing commands:', error);
  }
})();
