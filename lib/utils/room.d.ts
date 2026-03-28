import { Context } from 'koishi';
import { ConversationRoom } from '../types';
export declare function getUserRoom(ctx: Context, userId: string, channelId: string): Promise<ConversationRoom | null>;
export declare function getAllRooms(ctx: Context): Promise<Array<{
    userId: string;
    channelId: string;
    room: ConversationRoom;
}>>;
export declare function resolveRoomByConversationId(ctx: Context, conversationId: string): Promise<ConversationRoom | null>;
//# sourceMappingURL=room.d.ts.map