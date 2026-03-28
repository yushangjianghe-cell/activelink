import { Context } from 'koishi'
import { ConversationRoom } from '../types'

export async function getUserRoom(
  ctx: Context,
  userId: string,
  channelId: string
): Promise<ConversationRoom | null> {
  const logger = ctx.logger('activelink')

  let guildId: string
  let isGroup = false

  if (channelId.startsWith('private:')) {
    guildId = '0'
    isGroup = false
  } else if (channelId.includes(':')) {
    guildId = channelId.split(':')[0]
    isGroup = true
  } else if (/^\d{6,}$/.test(channelId)) {
    guildId = channelId
    isGroup = true
  } else {
    guildId = '0'
    isGroup = false
  }

  try {
    if (isGroup) {
      const userRooms = await ctx.database.get('chathub_user', {
        groupId: guildId
      })

      if (userRooms.length === 0) {
        return null
      }

      const roomId = userRooms[0].defaultRoomId
      const rooms = await ctx.database.get('chathub_room', { roomId })
      return rooms.length > 0 ? (rooms[0] as ConversationRoom) : null
    } else {
      const userRooms = await ctx.database.get('chathub_user', {
        userId,
        groupId: '0'
      })

      if (userRooms.length === 0) {
        return null
      }

      const roomId = userRooms[0].defaultRoomId
      const rooms = await ctx.database.get('chathub_room', { roomId })
      return rooms.length > 0 ? (rooms[0] as ConversationRoom) : null
    }
  } catch (err) {
    logger.error('Failed to get room:', err)
    return null
  }
}

export async function getAllRooms(ctx: Context): Promise<Array<{ userId: string; channelId: string; room: ConversationRoom }>> {
  const logger = ctx.logger('activelink')
  const results: Array<{ userId: string; channelId: string; room: ConversationRoom }> = []

  try {
    const users = await ctx.database.get('chathub_user', {})

    for (const user of users) {
      const rooms = await ctx.database.get('chathub_room', {
        roomId: user.defaultRoomId
      })

      if (rooms.length > 0) {
        const channelId = user.groupId === '0' ? `private:${user.userId}` : user.groupId
        results.push({
          userId: user.userId,
          channelId,
          room: rooms[0] as ConversationRoom
        })
      }
    }
  } catch (err) {
    logger.error('Failed to get all rooms:', err)
  }

  return results
}

export async function resolveRoomByConversationId(
  ctx: Context,
  conversationId: string
): Promise<ConversationRoom | null> {
  try {
    const rooms = await ctx.database.get('chathub_room', { conversationId })
    return rooms.length > 0 ? (rooms[0] as ConversationRoom) : null
  } catch (err) {
    ctx.logger('activelink').error('Failed to resolve room by conversationId:', err)
    return null
  }
}
