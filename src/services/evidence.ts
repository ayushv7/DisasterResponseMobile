/**
 * Turns device-captured evidence into the payload the backend expects:
 * uploads the camera photo first, then references it by URL. Upload goes
 * through api.uploadEvidencePhoto (presigned upload contract pending).
 */
import { api } from '@/services/api';
import { EvidenceDraft, RegisterResourceInput } from '@/types/contributors';

export async function prepareEvidence(
  draft: EvidenceDraft,
  onStage?: (stage: 'uploading' | 'submitting') => void
): Promise<{ evidence: RegisterResourceInput['evidence']; uploadSimulated: boolean }> {
  let photoUrl: string | undefined;
  let uploadSimulated = false;
  if (draft.photoUri) {
    onStage?.('uploading');
    const upload = await api.uploadEvidencePhoto(draft.photoUri);
    photoUrl = upload.data.photoUrl;
    uploadSimulated = upload.source === 'sample';
  }
  onStage?.('submitting');
  return {
    evidence: { gps: draft.gps, capturedAt: draft.capturedAt, photoUrl, note: draft.note?.trim() || undefined },
    uploadSimulated,
  };
}
