// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, REST, Routes } = require('discord.js');
const { token, clientId } = require('./src/config/botConfig.json');
const fs = require('fs'); // Import fs to read command files

// Record the start time
const startTime = Date.now();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Function to load commands
async function loadCommands() {
    const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
    const commands = [];

    for (const file of commandFiles) {
        const command = require(`./src/commands/${file}`);
        commands.push(command.data.toJSON());
    }

    // Register commands with the Discord API
    const rest = new REST({ version: '10' }).setToken(token);
    try {
        console.log('\x1b[1m\x1b[34mStarted refreshing application (/) commands.\x1b[0m');

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log('\x1b[1m\x1b[34mSuccessfully reloaded application (/) commands.\x1b[0m');
    } catch (error) {
        console.error(error);
    }

    return commands.length;
}

// Function to load events
function loadEvents() {
    const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
    const events = [];

    for (const file of eventFiles) {
        const event = require(`./src/events/${file}`);
        events.push(event);
    }

    return events.length;
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

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, async readyClient => {
    const elapsedTime = Date.now() - startTime;
    
    console.log(startupMessage);
    const commandCount = await loadCommands(); // Load commands
    const eventCount = loadEvents(); // Load events
    
    console.log(`\x1b[1m\x1b[34m📦 Database connection has been established.\x1b[0m`);
    console.log(`\x1b[1m\x1b[34m💫 Succesfully loaded ${eventCount} event(s).\x1b[0m`);
    console.log(`\x1b[1m\x1b[34m🔥 Succesfully loaded ${commandCount} slash command(s).\x1b[0m\n`);

    console.log(`\x1b[1m\x1b[34m⌛ Ready in ${elapsedTime} ms\x1b[0m`);
    console.log(`\x1b[1m\x1b[34m🚀 Logged in as ${readyClient.user.tag}\x1b[0m`);
});

// Log in to Discord with your client's token
client.login(token);