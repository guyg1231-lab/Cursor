import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { RouteErrorState } from '@/components/shared/RouteState';
import { supabase } from '@/integrations/supabase/client';
import { tokens } from '@/lib/design-tokens';
import { getOtpCooldownSeconds, requestOtpEmail } from '@/lib/authOtp';
import {
  buildAuthCallbackPath,
  consumePostAuthReturnTo,
  parseSafeReturnTo,
  readPostAuthReturnTo,
  storePostAuthReturnTo,
} from '@/lib/authReturnTo';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmailAddress } from '@/lib/validation';

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const seconds = String(safeSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();

  const queryReturnTo = parseSafeReturnTo(searchParams.get('returnTo'));
  const storedReturnTo = readPostAuthReturnTo();
  const effectiveReturnTo = useMemo(() => queryReturnTo ?? storedReturnTo, [queryReturnTo, storedReturnTo]);
  const callbackPath = useMemo(() => buildAuthCallbackPath(effectiveReturnTo), [effectiveReturnTo]);

  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<'sending' | 'verifying' | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [failedAttempts, setFailedAttempts] = useState(0);

  const emailValidation = validateEmailAddress(email);
  const remainingSeconds = step === 'sent' && otpExpiresAt != null
    ? Math.max(0, Math.ceil((otpExpiresAt - countdownNow) / 1000))
    : 0;
  const isOtpExpired = step === 'sent' && otpExpiresAt != null && remainingSeconds === 0;

  useEffect(() => {
    storePostAuthReturnTo(effectiveReturnTo);
  }, [effectiveReturnTo]);

  useEffect(() => {
    if (step !== 'sent') return;

    const intervalId = window.setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [step]);

  useEffect(() => {
    if (step !== 'sent') {
      setResendCooldown(0);
      return;
    }

    const normalizedEmail = emailValidation.normalized;
    if (!emailValidation.isValid || !normalizedEmail) {
      setResendCooldown(0);
      return;
    }

    const updateCooldown = () => {
      setResendCooldown(getOtpCooldownSeconds(normalizedEmail));
    };

    updateCooldown();
    const intervalId = window.setInterval(updateCooldown, 1000);
    return () => window.clearInterval(intervalId);
  }, [emailValidation.isValid, emailValidation.normalized, step]);

  if (!isLoading && user) {
    const destination = consumePostAuthReturnTo() ?? '/dashboard';
    return <Navigate to={destination} replace />;
  }

  async function sendOtpRequest() {
    const result = await requestOtpEmail({
      email: emailValidation.normalized,
      emailRedirectTo: `${window.location.origin}${callbackPath}`,
    });

    if (!result.ok) {
      if ((result.code === 'rate_limit' || result.code === 'rate_limit_quota') && result.retryAfterSeconds != null) {
        setResendCooldown(result.retryAfterSeconds);
      }

      switch (result.code) {
        case 'invalid_email':
          setSubmitError('צריך להזין כתובת אימייל תקינה כדי להמשיך.');
          return false;
        case 'rate_limit':
        case 'rate_limit_quota':
          setSubmitError(`יש להמתין ${result.retryAfterSeconds ?? 60} שניות לפני שליחת קוד חדש.`);
          return false;
        case 'rate_limit_unknown':
          setSubmitError('יש כרגע מגבלת שליחה זמנית. אפשר לנסות שוב בעוד רגע.');
          return false;
        case 'network':
          setSubmitError('יש תקלה זמנית בחיבור. אפשר לנסות שוב בעוד רגע.');
          return false;
        default:
          setSubmitError('לא הצלחנו לשלוח כרגע קוד אימות. אפשר לנסות שוב בעוד רגע.');
          return false;
      }
    }

    setFailedAttempts(0);
    setResendCooldown(result.retryAfterSeconds ?? 60);
    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailValidation.isValid) {
      if (emailValidation.code === 'required') {
        setSubmitError('צריך להזין כתובת אימייל כדי להמשיך.');
      } else {
        setSubmitError('צריך להזין כתובת אימייל תקינה כדי להמשיך.');
      }
      return;
    }

    setLoadingPhase('sending');
    setSubmitError(null);

    try {
      const isSent = await sendOtpRequest();
      if (!isSent) return;

      setSubmittedEmail(emailValidation.normalized);
      setOtpCode('');
      setOtpExpiresAt(Date.now() + 10 * 60 * 1000);
      setStep('sent');
    } finally {
      setLoadingPhase(null);
    }
  }

  async function handleResend() {
    if (!emailValidation.isValid) return;
    if (resendCooldown > 0) {
      setSubmitError(`יש להמתין ${resendCooldown} שניות לפני שליחת קוד חדש.`);
      return;
    }

    setLoadingPhase('sending');
    setSubmitError(null);

    try {
      const isSent = await sendOtpRequest();
      if (!isSent) return;

      setOtpCode('');
      setOtpExpiresAt(Date.now() + 10 * 60 * 1000);
    } finally {
      setLoadingPhase(null);
    }
  }

  async function handleVerifyOtp(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const code = otpCode.trim().replace(/\s/g, '');
    if (code.length !== 6) {
      setSubmitError('צריך להזין קוד בן 6 ספרות.');
      return;
    }

    setLoadingPhase('verifying');
    setSubmitError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailValidation.normalized ?? submittedEmail,
        token: code,
        type: 'email',
      });

      if (error) {
        setFailedAttempts((count) => count + 1);
        setSubmitError('הקוד שגוי או שפג תוקפו. אפשר לנסות שוב או לבקש קוד חדש.');
        return;
      }

      navigate(callbackPath, { replace: true });
    } catch {
      setFailedAttempts((count) => count + 1);
      setSubmitError('לא הצלחנו לאמת את הקוד כרגע. אפשר לנסות שוב בעוד רגע.');
    } finally {
      setLoadingPhase(null);
    }
  }

  function goBackToEmailStep() {
    setStep('email');
    setOtpCode('');
    setFailedAttempts(0);
    setOtpExpiresAt(null);
    setSubmitError(null);
  }

  return (
    <PageShell
      title="כניסה לאזור האישי"
      subtitle="נשלח לך קוד חד-פעמי למייל, ואחרי האימות נחזיר אותך בדיוק למקום שממנו רצית להמשיך."
    >
      {submitError && step === 'email' ? (
        <div className="mb-4">
          <RouteErrorState title="לא הצלחנו לשלוח קישור כניסה" body={submitError} />
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <Card className={tokens.card.accent}>
          <CardHeader>
            <CardTitle className="text-2xl">התחברות עם קוד למייל</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-foreground/85 leading-relaxed">
            <p>
              לא צריך סיסמה. שולחים קוד חד-פעמי למייל, מזינים אותו כאן, וממשיכים ישר ליעד ששמרנו עבורך.
            </p>

            {effectiveReturnTo ? (
              <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm">
                היעד שנשמר אחרי ההתחברות: <span className="font-mono text-xs">{effectiveReturnTo}</span>
              </div>
            ) : null}

            {step === 'sent' ? (
              <div className="space-y-3">
                <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm space-y-2">
                  <p>
                    שלחנו קוד אימות אל <strong className="text-foreground">{submittedEmail}</strong>.
                  </p>
                  <p>מזינים כאן את 6 הספרות שקיבלת, ואז ממשיכים אוטומטית ליעד ששמרנו.</p>
                  <p>תוקף הקוד: {formatCountdown(remainingSeconds)}</p>
                </div>

                <form className="space-y-4" onSubmit={handleVerifyOtp}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="auth-otp">
                      קוד אימות
                    </label>
                    <input
                      id="auth-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        const nextValue = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(nextValue);
                      }}
                      className="w-full rounded-full border border-input bg-background px-4 py-3 text-center text-lg tracking-[0.35em] outline-none"
                      placeholder="123456"
                    />
                    {failedAttempts > 0 ? (
                      <p className="text-xs text-muted-foreground">ניסיונות אימות שגויים: {failedAttempts}</p>
                    ) : null}
                    {isOtpExpired ? (
                      <p className="text-xs text-destructive">פג תוקף הקוד. צריך לבקש קוד חדש.</p>
                    ) : null}
                  </div>

                  {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" variant="primary" disabled={loadingPhase !== null || otpCode.length !== 6 || isOtpExpired}>
                      {loadingPhase === 'verifying' ? 'מאמתים...' : 'לאמת קוד ולהמשיך'}
                    </Button>
                    <Button type="button" variant="outline" disabled={loadingPhase !== null} onClick={handleResend}>
                      {loadingPhase === 'sending' ? 'שולחים...' : resendCooldown > 0 ? `שליחה מחדש בעוד ${resendCooldown}` : 'לשלוח קוד חדש'}
                    </Button>
                    <Button type="button" variant="ghost" disabled={loadingPhase !== null} onClick={goBackToEmailStep}>
                      לשנות אימייל
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="auth-email">
                    אימייל
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-full border border-input bg-background px-4 py-3 text-sm outline-none"
                    placeholder="name@example.com"
                  />
                </div>

                {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

                <Button type="submit" variant="primary" disabled={loadingPhase !== null}>
                  {loadingPhase === 'sending' ? 'שולחים...' : 'לשלוח קוד אימות'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-xl">איך זה עובד?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>1. מזינים אימייל ומקבלים קוד בן 6 ספרות.</p>
            <p>2. מזינים את הקוד כאן, והסשן נוצר מיד אחרי האימות.</p>
            <p>3. חוזרים אוטומטית להגשה או לדשבורד, בלי לחפש שוב את המקום הנכון.</p>
            <Button asChild variant="outline">
              <Link to="/events">חזרה למפגשים</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
