import { Flashcore } from 'robo.js'
import type { VoiceState } from 'discord.js'
import { client } from 'robo.js'

const TEXT_CHANNEL_ID = process.env.TEXT_CHANNEL_ID
const MESSAGE_DELETE_TIMEOUT = process.env.MESSAGE_DELETE_TIMEOUT

export default async (oldState: VoiceState, newState: VoiceState) => {
	if (oldState.channelId === newState.channelId) return
	if (!newState.channelId) return

	const member = newState.member
	if (!member) return

	const username = member.user.username
	const userId = member.user.id
	const textChannel = await client.channels.fetch(TEXT_CHANNEL_ID)
	if (!textChannel || !textChannel.isTextBased() || textChannel.type !== 0) return

	const content = `<@${userId}> joined <#${newState.channelId}>`
	const message = await textChannel.send({
		content,
		allowedMentions: { users: [], roles: [], parse: [] }
	})
	setTimeout(() => message.delete().catch(() => {}), MESSAGE_DELETE_TIMEOUT)

	const log = {
		timestamp: Date.now(),
		userId,
		username,
		voiceChannelId: newState.channelId
	}
	const logKey = `voice-join-${userId}-${log.timestamp}`

	await Flashcore.set(logKey, log, { namespace: 'voice-joins' })

	const keyListKey = 'voice-joins-keys'
	let keyList = await Flashcore.get<string[]>(keyListKey, { namespace: 'voice-joins' })
	if (!keyList) keyList = []
	if (!keyList.includes(logKey)) {
		keyList.push(logKey)
		await Flashcore.set(keyListKey, keyList, { namespace: 'voice-joins' })
	}
}
