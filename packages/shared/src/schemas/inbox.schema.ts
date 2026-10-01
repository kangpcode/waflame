import { z } from 'zod';
import { ConversationStatus } from '../constants/inbox.js';
import { MessageType } from '../constants/messages.js';

export const InboxReplySchema = z.object({
  content: z.string().min(1, 'Isi balasan tidak boleh kosong'),
  mediaUrl: z.string().url('URL media tidak valid').optional().nullable(),
  mediaType: z.enum([MessageType.TEXT, MessageType.IMAGE, MessageType.VIDEO, MessageType.DOCUMENT]).default(MessageType.TEXT),
});

export type InboxReplyInput = z.infer<typeof InboxReplySchema>;

export const InternalNoteSchema = z.object({
  content: z.string().min(1, 'Catatan internal tidak boleh kosong').max(2000),
});

export type InternalNoteInput = z.infer<typeof InternalNoteSchema>;

export const AssignAgentSchema = z.object({
  agentId: z.string().uuid().nullable(),
});

export type AssignAgentInput = z.infer<typeof AssignAgentSchema>;

export const UpdateConversationStatusSchema = z.object({
  status: z.enum([
    ConversationStatus.OPEN,
    ConversationStatus.PENDING,
    ConversationStatus.RESOLVED,
  ]),
});

export type UpdateConversationStatusInput = z.infer<typeof UpdateConversationStatusSchema>;

export const ConversationFilterQuerySchema = z.object({
  status: z.enum([
    ConversationStatus.OPEN,
    ConversationStatus.PENDING,
    ConversationStatus.RESOLVED,
  ]).optional(),
  assignedAgentId: z.string().uuid().optional(),
  deviceId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => (val ? Number(val) : 20), z.number().int().min(1).max(100).default(20)),
});

export type ConversationFilterQuery = z.infer<typeof ConversationFilterQuerySchema>;
