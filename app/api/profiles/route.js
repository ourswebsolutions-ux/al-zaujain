import { currentUser } from '@/lib/auth.js';
import { jsonError, sameOrigin } from '@/lib/api.js';
import { submitProfileRequest } from '@/lib/profile-service.js';
import { UploadError } from '@/lib/uploads.js';

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Invalid request origin.', 403);
  const user = await currentUser();
  try {
    const result = await submitProfileRequest(await request.formData(), user);
    if (!result.ok) return Response.json(result, { status: result.status });
    return Response.json({ ok: true, code: result.code, url: result.url });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 422);
    console.error('Profile submission failed:', error);
    return jsonError('Something went wrong while saving your profile. Please try again.', 500);
  }
}
