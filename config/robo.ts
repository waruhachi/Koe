import type { Config } from 'robo.js'

export default <Config>{
	clientOptions: {
		intents: ['Guilds', 'GuildMessages', 'GuildVoiceStates']
	},
	plugins: [],
	type: 'robo'
}
