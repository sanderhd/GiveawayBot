require('dotenv').config();
const { Client, Events, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.TOKEN;
const clientId = process.env.CLIENTID;

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const commands = [];

// Function to recursively get all files in a directory and its subdirectories
function getFilesRecursively(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = entries
    .filter(file => !file.isDirectory())
    .map(file => path.join(directory, file.name));
  const directories = entries.filter(entry => entry.isDirectory());
  
  for (const dir of directories) {
    files.push(...getFilesRecursively(path.join(directory, dir.name)));
  }
  return files;
}

// Load command files from the commands directory (and subdirectories)
const commandFiles = getFilesRecursively(path.join(__dirname, 'src/commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(file);
  
  // Check if the command has a data property and an execute function
  if (command.data && typeof command.execute === 'function') {
    commands.push(command); // Store the full command object
    console.log(`Loaded command: ${command.data.name}`);
  } else {
    console.error(`Command in file ${file} is missing 'data' or 'execute' function.`);
  }
}

// Load event files from the events directory (and subdirectories)
const eventFiles = getFilesRecursively(path.join(__dirname, 'src/events')).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(file);
  
  // Check if the event exports the required properties
  if (event.name && typeof event.execute === 'function') {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client)); // For events that fire once
    } else {
      client.on(event.name, (...args) => event.execute(...args, client)); // For regular events
    }
    console.log(`Loaded event: ${event.name}`);
  } else {
    console.error(`Event in file ${file} is missing 'name' or 'execute' function.`);
  }
}

// Combined ASCII Art and love message with colors
const startupMessage = `
\x1b[1m\x1b[36m _____                 _           _   _______ 
\x1b[36m/  ___|               | |         | | | |  _  \\
\x1b[36m\\ \`--.  __ _ _ __   __| | ___ _ __| |_| | | | |
\x1b[36m \`--. \\/ _\` | '_ \\ / _\` |/ _ \\ '__|  _  | | | |
\x1b[36m/\\__/ / (_| | | | | (_| |  __/ |  | | | | |/ / 
\x1b[36m\\____/ \\__,_|_| |_|\\__,_|\\___|_|  \\_| |_/___/                                               
\x1b[1m\x1b[36m❤️  With love from\x1b[0m \x1b[1m\x1b[34mSander\x1b[0m
`;

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async () => {
  const elapsedTime = Date.now() - startTime;
  console.log(startupMessage);
  
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands.map(cmd => cmd.data.toJSON()) });
    console.log('Slash commands registered!');
  } catch (error) {
    console.error('An error occurred while registering commands:', error);
  }

  const commandCount = commands.length;
  const eventCount = eventFiles.length;

  console.log(`\x1b[1m\x1b[36m📦 Database connection has been \x1b[34mestablished.\x1b[0m`);
  console.log(`\x1b[1m\x1b[36m💫 Succesfully loaded \x1b[34m${eventCount}\x1b[36m event(s).\x1b[0m`);
  console.log(`\x1b[1m\x1b[36m🔥 Succesfully loaded \x1b[34m${commandCount}\x1b[36m slash command(s).\x1b[0m\n`);

  console.log(`\x1b[1m\x1b[36m⌛ Ready in \x1b[34m${elapsedTime} ms\x1b[36m`);
  console.log(`\x1b[1m\x1b[36m🚀 Logged in as \x1b[34m${client.user.tag}\x1b[36m`);
});

// Listen for interactions (commands)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return; // Ignore non-command interactions

  const command = commands.find(cmd => cmd.data.name === interaction.commandName);
  
  if (!command) return; // If the command is not found, exit

  try {
    await command.execute(interaction); // Execute the command
  } catch (error) {
    console.error('Error executing command:', error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

// Log in to Discord with your app's token
client.login(token);