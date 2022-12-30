import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
// import Koa from 'koa';
import * as dotenv from 'dotenv';
import Listr from 'listr';
import { Client, Events, GatewayIntentBits } from 'discord.js';

// ============================================================================

dotenv.config();
const { DISCORD_TOKEN, KOOK_BOT_API_BASE } = process.env;
const monitorChannels = [];

// ============================================================================

export let client: Client;
// export let app: Koa;

// ============================================================================

(async function () {
    /** 当前是否是开发环境 */
    const isEnvDevelopment = process.env.WEBPACK_BUILD_ENV === 'dev';

    // 如果是开发环境，检查 `.env` 文件是否存在
    if (isEnvDevelopment) {
        const rootEnvFile = path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            '../.env'
        );
        if (!fs.existsSync(rootEnvFile)) throw new Error('.env file missing');
    }

    // 注册结束进程
    process.on('exit', () => {
        client?.destroy();
    });

    // 开始流程
    new Listr([
        {
            title: 'Creating Discord.js client',
            task: () => {
                client = new Client({
                    intents: [
                        GatewayIntentBits.Guilds,
                        GatewayIntentBits.MessageContent,
                        GatewayIntentBits.GuildMessages,
                    ],
                });

                // When the client is ready, run this code (only once)
                // We use 'c' for the event parameter to keep it separate from the already defined 'client'
                client.once(Events.ClientReady, (c) => {
                    console.log(`Ready! Logged in as ${c.user.tag}`);
                });

                client.on(Events.Error, (e) => console.trace(e));

                client.on(
                    Events.MessageCreate,
                    ({
                        createdTimestamp,
                        author,
                        content,
                        attachments,
                        type,
                        system,
                        ...message
                    }) => {
                        if (system) return;
                        if (type !== 0) return;
                        // Message Types https://discord-api-types.dev/api/discord-api-types-v10/enum/MessageType
                        console.log({
                            createdTimestamp,
                            author,
                            content,
                            type,
                            system,
                        });
                        for (const [
                            id,
                            { url, contentType, ...attachment },
                        ] of attachments) {
                            console.log({ id, url, contentType });
                        }
                    }
                );

                client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
                    //
                });
                // client.on(Events.Debug, (...args) => {
                //     console.log(...args);
                // });
            },
        },
        {
            title: 'Logging into Discord',
            task: () => client.login(DISCORD_TOKEN),
        },
        // {
        //     title: 'Starting Koa server for Koot bot',
        //     task: () =>
        //         new Promise((resolve) => {
        //             app = new Koa();

        //             app.use(async (ctx) => {
        //                 ctx.body = 'Hello World';
        //             });

        //             app.listen(3000, async function () {
        //                 resolve(3000);
        //             });
        //         }),
        // },
    ])
        .run()
        .catch((err) => {
            console.log('\n');
            console.error(err);
        });
})();
