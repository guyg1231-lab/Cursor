import { supabase } from '@/integrations/supabase/client';

/**
 * After OTP / redirect, `useAuth().user` can update before the GoTrue session
 * is attached to the browser client — first PostgREST calls may run as anon and fail RLS.
 * Waits briefly until `getSession()` matches the expected user id.
 */
export async function waitForSupabaseSessionUser(
  expectedUserId: string,
  options?: { attempts?: number; delayMs?: number },
): Promise<boolean> {
  const attempts = options?.attempts ?? 14;
  const delayMs = options?.delayMs ?? 90;

  for (let i = 0; i < attempts; i += 1) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id === expectedUserId) {
      return true;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}
