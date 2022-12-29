import Koa from 'koa';
import * as dotenv from 'dotenv';
import Listr from 'listr';
import { Client, Events, GatewayIntentBits } from 'discord.js';

// ============================================================================

dotenv.config();
const { DISCORD_TOKEN: token } = process.env;

// ============================================================================

export let client: Client;
export let app: Koa;

// ============================================================================

const tasks = new Listr([
    {
        title: 'Creating Discord.js client',
        task: () => {
            client = new Client({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.MessageContent,
                ],
            });

            // When the client is ready, run this code (only once)
            // We use 'c' for the event parameter to keep it separate from the already defined 'client'
            client.once(Events.ClientReady, (c) => {
                console.log(`Ready! Logged in as ${c.user.tag}`);
            });

            client.on(Events.Error, (e) => console.trace(e));
        },
    },
    {
        title: 'Logging into Discord',
        task: () => client.login(token),
    },
    {
        title: 'Starting Koa server',
        task: () =>
            new Promise((resolve) => {
                app = new Koa();

                app.use(async (ctx) => {
                    ctx.body = 'Hello World';
                });

                app.listen(3000, async function () {
                    resolve(3000);
                });
            }),
    },
]);

tasks.run().catch((err) => {
    console.error(err);
});
