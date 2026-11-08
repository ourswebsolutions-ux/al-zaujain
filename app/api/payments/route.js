import { jsonError, sameOrigin } from '@/lib/api.js';
import { currentUser } from '@/lib/auth.js';
import { submitPayment, UploadError } from '@/lib/payments.js';

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Invalid request origin.', 403);
  const user = await currentUser();
  if (!user) return jsonError('Please sign in.', 401);
  if (user.role !== 'user') return jsonError('Staff accounts do not need to pay.', 403);
  try {
    const result = await submitPayment(await request.formData(), user);
    if (!result.ok) return jsonError(result.message, result.status);
    return Response.json({ ok: true, id: result.id });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 422);
    console.error('Payment submission failed:', error);
    return jsonError('Something went wrong. Please try again.', 500);
  }
}
