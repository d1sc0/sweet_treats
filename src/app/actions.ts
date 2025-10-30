'use server';

import { detectSweetTreat } from '@/ai/flows/detect-sweet-treat';
import { z } from 'zod';

const PhotoSchema = z.string().refine((s) => s.startsWith('data:image/'), {
  message: 'Invalid image data URI',
});

type ActionResult = Promise<{ isSweetTreat: boolean } | { error: string }>;

export async function checkForSweetTreat(
  photoDataUri: string
): ActionResult {
  try {
    const validatedPhoto = PhotoSchema.parse(photoDataUri);
    const result = await detectSweetTreat({ photoDataUri: validatedPhoto });
    return result;
  } catch (e) {
    console.error('[ACTION_ERROR]', e);
    if (e instanceof z.ZodError) {
      return { error: 'Invalid data format provided.' };
    }
    return { error: 'An unexpected error occurred during analysis. Please try again.' };
  }
}
