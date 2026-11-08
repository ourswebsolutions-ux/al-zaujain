import { jsonError, sameOrigin } from '@/lib/api.js';
import { currentUser } from '@/lib/auth.js';
import { chatBlockReason, conversationFor, fetchMessages, sendMessageAs } from '@/lib/chat.js';

async function load(params) {
  const user = await currentUser();
  if (!user) return { error: jsonError('Please sign in.', 401) };
  const { id } = await params;
  const conversation = await conversationFor(Number(id), user.id);
  if (!conversation) return { error: jsonError('Conversation not found.', 404) };
  const otherId = conversation.user_low === user.id ? conversation.user_high : conversation.user_low;
  return { user, conversation, otherId };
}

export async function GET(request, { params }) {
  const { error, user, conversation, otherId } = await load(params);
  if (error) return error;
  const after = Number(request.nextUrl.searchParams.get('after')) || 0;
  return Response.json({ messages: await fetchMessages(conversation.id, user.id, after), blocked: await chatBlockReason(user, otherId) });
}

export async function POST(request, { params }) {
  if (!sameOrigin(request)) return jsonError('Invalid request origin.', 403);
  const { error, user, conversation, otherId } = await load(params);
  if (error) return error;
  const body = (await request.json().catch(() => null))?.body;
  const result = await sendMessageAs(user, conversation.id, otherId, body);
  if (!result.ok) return jsonError(result.message, result.status, result.upgrade ? { upgrade: true } : {});
  return Response.json({ ok: true, message: result.message });
}
