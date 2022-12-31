# FLY-DBH Discord Bot

## 环境变量

-   **本地开发**：环境变量存储在项目根目录的 `.env` 文件中。该文件不会上传到 _Git_。
-   **生产环境**：自行设置系统的环境变量。

**使用的环境变量**

| 变量名             | 值                                     |
| ------------------ | -------------------------------------- |
| DISCORD_TOKEN      | Discord bot token                      |
| DISCORD_TOKEN_FILE | Discord bot token (Docker secret file) |
| KOOK_BOT_API_BASE  | Koot bot API Base                      |

## 当前能力

-   ✅ 以 BOT 身份登入 Discord
-   ✅ 监视目标服务器新消息
