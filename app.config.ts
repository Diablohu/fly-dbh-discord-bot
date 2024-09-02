export const logDir =
    process.env.WEBPACK_BUILD_ENV === 'dev' ? '.logs' : '/.logs';

/**
 * 监视以下 Discrod 频道
 * - 如有新消息，将会请求 KOOK_BOT_API_BASE 服务器的 sync-discord-message 接口，进行消息同步
 */
export const channelsSyncToKook: string[] = [
    '1057919252922892298', // bot channel

    // MSFS
    '983629937451892766', // fs news channel 1
    '1058110232972247103', // fs news channel 2
    '1097849730731626578', // fs news channel 3
    '1060032674988826664', // fs news manual sync
    '1061038884143763538', // fs group

    // Other Games
    '1059769292717039626', // imas news channel
    '1069820588538986536', // kancolle news channel

    // Other Topics
    '1280002286046674974', // VT
];
if (process.env.WEBPACK_BUILD_ENV === 'dev') {
    channelsSyncToKook.push('1061924579100078090');
}
