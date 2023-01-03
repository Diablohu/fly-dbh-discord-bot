export const logDir =
    process.env.WEBPACK_BUILD_ENV === 'dev' ? '.logs' : '/.logs';
