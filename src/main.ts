import type { Message, ClientEvents } from 'discord.js';

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
// import Koa from 'koa';
import * as dotenv from 'dotenv';
import Listr from 'listr';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import winston from 'winston';
import 'winston-daily-rotate-file';

import { logDir, channelsSyncToKook } from '../app.config';

// ============================================================================

dotenv.config();

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        // winston.format.label({ label: 'right meow!' }),
        winston.format.timestamp(),
        winston.format.prettyPrint()
    ),
    defaultMeta: { service: 'fly-dbh-discord-bot' },
    transports: ['error', 'warn', 'notice', 'info', 'http', undefined].map(
        (level) =>
            new winston.transports.DailyRotateFile({
                level,
                filename: path.resolve(
                    logDir,
                    `%DATE%.${level || 'combined'}.log`
                ),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxFiles: '7d',
                utc: true,
            })
    ),
});

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

function getPostDataFromMessage(msg: Message, eventType: keyof ClientEvents) {
    const {
        id,
        channelId,
        createdTimestamp,
        author,
        content,
        attachments,
        embeds,
        type,
        system,
        ...message
    } = msg;

    // Message Types https://discord-api-types.dev/api/discord-api-types-v10/enum/MessageType
    logger.info({
        event: eventType,
        message: {
            createdTimestamp,
            author,
            content,
            type,
            system,
            embeds,
            ...message,
        },
    });

    // return {
    //     channelId:
    //         channelsToKook[channelId as keyof typeof channelsToKook] ||
    //         6086801551312186,
    //     msgId: id,
    //     userId: author.id,
    //     userName: author.username,
    //     userAvatar: `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.webp`,
    //     userAvatarId: author.avatar,
    //     createAt: createdTimestamp,
    //     body: content,
    //     attachments: [...attachments].map(
    //         ([id, { url, contentType, ...attachment }]) => ({
    //             url,
    //             type: contentType,
    //         })
    //     ),
    //     embeds,
    //     source: 'discord',
    // };
    return {
        ...msg,
        author: {
            id: author.id,
            username: author.username,
            avatar: author.avatar,
        },
        attachments: [...attachments],
    };
}

async function createClient(): Promise<void> {
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

    client.on(Events.Error, (e) => {
        logger.error(e);
        console.trace(e);
    });

    client.on(Events.MessageCreate, async (message) => {
        if (message.system) return;
        if (message.type !== 0) return;
        if (!channelsSyncToKook.includes(`${message.channelId}`)) return;

        await axios.post(
            `${KOOK_BOT_API_BASE}/sync-discord-message`,
            getPostDataFromMessage(message, Events.MessageCreate)
        );

        // console.log(res);
    });

    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (newMessage.system) return;
        if (newMessage.type !== 0) return;
        if (!channelsSyncToKook.includes(`${newMessage.channelId}`)) return;
        // console.log('MessageUpdate', oldMessage, newMessage);
        await axios.post(
            `${KOOK_BOT_API_BASE}/sync-discord-message`,
            getPostDataFromMessage(newMessage as Message, Events.MessageUpdate)
        );

        // console.log(res);
    });
    // client.on(Events.Debug, (...args) => {
    //     console.log(...args);
    // });
}

async function clientLogin(): Promise<string> {
    return client.login(DISCORD_TOKEN);
}

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
    process.on('uncaughtException', function (err) {
        console.log('Caught exception: ', err);
    });

    // 开始流程
    new Listr(
        [
            {
                title: 'Creating Discord.js client',
                task: createClient,
            },
            {
                title: 'Logging into Discord',
                task: clientLogin,
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
        ],
        { exitOnError: false }
    )
        .run()
        .catch((err) => {
            logger.error(err);
            console.log('\n');
            console.error(err);
        });
})().catch((err) => {
    logger.error(err);
    console.log('\n');
    console.error(err);
});
