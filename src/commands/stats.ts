import { Flashcore, createCommandConfig } from 'robo.js'
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js'

type VoiceJoinLog = {
	timestamp: number
	userId: string
	username: string
	voiceChannelId: string
}

function formatDuration(ms: number) {
	const totalSeconds = Math.floor(ms / 1000)
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60
	return `${hours}h ${minutes}m ${seconds}s`
}

export const config = createCommandConfig({
	description: "Show voice chat leaderboard or a user's voice chat history",
	options: [
		{
			name: 'user',
			description: 'User to get voice chat history for',
			type: 'user',
			required: false
		}
	]
} as const)

export default async (interaction: ChatInputCommandInteraction) => {
	const user = interaction.options.getUser('user')
	const keyListKey = 'voice-joins-keys'
	const keyList = await Flashcore.get<string[]>(keyListKey, { namespace: 'voice-joins' })
	if (!keyList || keyList.length === 0) {
		await interaction.reply({
			embeds: [new EmbedBuilder().setTitle('Voice Stats').setDescription('No voice join events logged.')]
		})
		return
	}

	const logs: VoiceJoinLog[] = []
	for (const key of keyList) {
		const log = await Flashcore.get<VoiceJoinLog>(key, { namespace: 'voice-joins' })
		if (log) logs.push(log)
	}
	logs.sort((a, b) => a.timestamp - b.timestamp)
	if (user) {
		const userLogs = logs.filter((l) => l.userId === user.id)
		if (!userLogs.length) {
			await interaction.reply({
				embeds: [new EmbedBuilder().setTitle('Voice History').setDescription('No history for this user.')]
			})
			return
		}
		const lines = userLogs.map((log) => `${new Date(log.timestamp).toLocaleString()} in <#${log.voiceChannelId}>`)
		const embed = new EmbedBuilder()
			.setTitle(`Voice History for ${user.username}`)
			.setDescription(lines.join('\n').slice(0, 4000))
		await interaction.reply({ embeds: [embed] })
		return
	}

	const userTimes: Record<string, { username: string; total: number; last: number | null }> = {}
	for (const log of logs) {
		if (!userTimes[log.userId]) userTimes[log.userId] = { username: log.username, total: 0, last: null }
		if (userTimes[log.userId].last) {
			const delta = log.timestamp - userTimes[log.userId].last!
			if (delta < 1000 * 60 * 60 * 6) userTimes[log.userId].total += delta
		}
		userTimes[log.userId].last = log.timestamp
	}

	const sorted = Object.entries(userTimes)
		.map(([userId, { username, total }]) => ({ userId, username, total }))
		.sort((a, b) => b.total - a.total)
	const lines = sorted.map((u, i) => `${i + 1}. <@${u.userId}>: ${formatDuration(u.total)}`)
	const embed = new EmbedBuilder().setTitle('Voice Chat Leaderboard').setDescription(lines.join('\n').slice(0, 4000))

	await interaction.reply({ embeds: [embed] })
}
