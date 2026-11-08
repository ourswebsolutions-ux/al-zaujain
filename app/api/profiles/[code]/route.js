import { jsonError, sameOrigin } from '@/lib/api.js';
import { currentUser } from '@/lib/auth.js';
import { idFromCode } from '@/lib/format.js';
import { editProfileRequest } from '@/lib/profile-service.js';
import { getProfile } from '@/lib/profiles.js';
import { UploadError } from '@/lib/uploads.js';

export async function PATCH(request, { params }) {
  if (!sameOrigin(request)) return jsonError('Invalid request origin.', 403);
  const { code } = await params;
  const profile = await getProfile(idFromCode(code));
  if (!profile) return jsonError('Profile not found.', 404);
  try {
    const result = await editProfileRequest(await request.formData(), profile, await currentUser());
    if (!result.ok) return Response.json(result, { status: result.status });
    return Response.json({ ok: true, code: result.code, reviewRequired: result.reviewRequired });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 422);
    console.error('Profile update failed:', error);
    return jsonError('Something went wrong while saving. Please try again.', 500);
  }
}
