"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRoom = getUserRoom;
exports.getAllRooms = getAllRooms;
exports.resolveRoomByConversationId = resolveRoomByConversationId;
async function getUserRoom(ctx, userId, channelId) {
    const logger = ctx.logger('activelink');
    let guildId;
    let isGroup = false;
    if (channelId.startsWith('private:')) {
        guildId = '0';
        isGroup = false;
    }
    else if (channelId.includes(':')) {
        guildId = channelId.split(':')[0];
        isGroup = true;
    }
    else if (/^\d{6,}$/.test(channelId)) {
        guildId = channelId;
        isGroup = true;
    }
    else {
        guildId = '0';
        isGroup = false;
    }
    try {
        if (isGroup) {
            const userRooms = await ctx.database.get('chathub_user', {
                groupId: guildId
            });
            if (userRooms.length === 0) {
                return null;
            }
            const roomId = userRooms[0].defaultRoomId;
            const rooms = await ctx.database.get('chathub_room', { roomId });
            return rooms.length > 0 ? rooms[0] : null;
        }
        else {
            const userRooms = await ctx.database.get('chathub_user', {
                userId,
                groupId: '0'
            });
            if (userRooms.length === 0) {
                return null;
            }
            const roomId = userRooms[0].defaultRoomId;
            const rooms = await ctx.database.get('chathub_room', { roomId });
            return rooms.length > 0 ? rooms[0] : null;
        }
    }
    catch (err) {
        logger.error('Failed to get room:', err);
        return null;
    }
}
async function getAllRooms(ctx) {
    const logger = ctx.logger('activelink');
    const results = [];
    try {
        const users = await ctx.database.get('chathub_user', {});
        for (const user of users) {
            const rooms = await ctx.database.get('chathub_room', {
                roomId: user.defaultRoomId
            });
            if (rooms.length > 0) {
                const channelId = user.groupId === '0' ? `private:${user.userId}` : user.groupId;
                results.push({
                    userId: user.userId,
                    channelId,
                    room: rooms[0]
                });
            }
        }
    }
    catch (err) {
        logger.error('Failed to get all rooms:', err);
    }
    return results;
}
async function resolveRoomByConversationId(ctx, conversationId) {
    try {
        const rooms = await ctx.database.get('chathub_room', { conversationId });
        return rooms.length > 0 ? rooms[0] : null;
    }
    catch (err) {
        ctx.logger('activelink').error('Failed to resolve room by conversationId:', err);
        return null;
    }
}
//# sourceMappingURL=room.js.map