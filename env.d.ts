export {}
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_OPTIONS: string
			DISCORD_CLIENT_ID: string
			DISCORD_TOKEN: string
			TEXT_CHANNEL_ID: string
			MESSAGE_DELETE_TIMEOUT: number
		}
	}
}
