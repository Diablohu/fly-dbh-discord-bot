import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
// import Koa from 'koa';
import * as dotenv from 'dotenv';
import Listr from 'listr';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import axios from 'axios';

// ============================================================================

dotenv.config();
const monitorChannels = [
    '1057919252922892298', // bot channel

    // '983629937451892766', // fs news channel 1
    // '1058110232972247103', // fs news channel 2
];

if (!process.env.DISCORD_TOKEN) {
    process.env.DISCORD_TOKEN =
        !!process.env.DISCORD_TOKEN_FILE &&
        fs.existsSync(process.env.DISCORD_TOKEN_FILE)
            ? fs.readFileSync(process.env.DISCORD_TOKEN_FILE, 'utf-8')
            : '';
}
const { DISCORD_TOKEN, KOOK_BOT_API_BASE } = process.env;

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
                        channelId,
                        createdTimestamp,
                        author,
                        content,
                        attachments,
                        embeds,
                        type,
                        system,
                        ...message
                    }) => {
                        if (system) return;
                        if (type !== 0) return;
                        if (!monitorChannels.includes(channelId)) return;
                        // Message Types https://discord-api-types.dev/api/discord-api-types-v10/enum/MessageType
                        console.log({
                            createdTimestamp,
                            author,
                            content,
                            type,
                            system,
                            embeds,
                        });
                        // for (const [
                        //     id,
                        //     { url, contentType, ...attachment },
                        // ] of attachments) {
                        //     console.log({ id, url, contentType });
                        // }
                        axios.post(`${KOOK_BOT_API_BASE}/sync-discord-bot`, {
                            userid: author.id,
                            username: author.username,
                            useravatar: author.avatar,
                            createAt: createdTimestamp,
                            body: content,
                            attachments: [...attachments].map(
                                ([
                                    id,
                                    { url, contentType, ...attachment },
                                ]) => ({
                                    url,
                                    type: contentType,
                                })
                            ),
                        });
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
