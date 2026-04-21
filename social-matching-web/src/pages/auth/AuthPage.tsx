import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { RouteErrorState } from '@/components/shared/RouteState';
import { supabase, type SupabaseBrowserConfigIssue } from '@/integrations/supabase/client';
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
import type { AuthOtpCode } from '@/lib/authOtp';

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const seconds = String(safeSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function hebrewSupabaseMisconfigurationHint(issue: SupabaseBrowserConfigIssue | undefined): string {
  switch (issue) {
    case 'missing_url':
      return (
        'חסרה כתובת פרויקט Supabase. ב־Vercel (או CI) יש להוסיף VITE_SUPABASE_URL בערך https://<מזהה>.supabase.co, ' +
        'לוודא שהמשתנה זמין בזמן הבנייה (Build) ולא רק בזמן ריצה של פונקציות שרת, ואז להריץ פריסה מחדש — עדכון משתנים לא מחליף bundle שכבר נבנה.'
      );
    case 'missing_key':
      return (
        'חסר מפתח אנונימי ל־Supabase. יש להוסיף VITE_SUPABASE_PUBLISHABLE_KEY או VITE_SUPABASE_ANON_KEY ' +
        'מ־Settings → API בפרויקט Supabase, זמין בזמן Build כמו למעלה, ולפרוס מחדש.'
      );
    case 'both_missing':
      return (
        'האתר נבנה בלי VITE_SUPABASE_URL ובלי מפתח אנונימי — הדפדפן לא יכול לפנות לפרויקט. ' +
        'יש להגדיר את שניהם בהוסטינג, לכלול גם סביבת Preview אם משתמשים בה, ולבצע build+deploy מחדש.'
      );
    case 'placeholder_url':
      return (
        'כתובת ה־Supabase שנשארה בבילד עדיין ערך דמה (למשל your-project). יש להחליף בכתובת האמיתית של הפרויקט ולפרוס מחדש.'
      );
    case 'placeholder_key':
      return (
        'מפתח ה־Supabase שנשאר בבילד נראה כמו טקסט דמה מהדוגמה. יש להחליף במפתח ה־anon/publishable האמיתי מלוח ה־API ולפרוס מחדש.'
      );
    default:
      return (
        'האפליקציה נטענה בלי הגדרות Supabase תקינות. יש להגדיר בזמן הבנייה את VITE_SUPABASE_URL ואת VITE_SUPABASE_PUBLISHABLE_KEY ' +
        '(או VITE_SUPABASE_ANON_KEY), ולפרוס מחדש.'
      );
  }
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
  /** Drives send-failure banner title so we do not stack two “could not send” headings on network errors. */
  const [emailSendFailureCode, setEmailSendFailureCode] = useState<AuthOtpCode | null>(null);
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
      setEmailSendFailureCode(result.code);
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
          setSubmitError(
            'לא הצלחנו להגיע לשרת האימות. כדאי לבדוק חיבור לאינטרנט או לנתונים סלולריים, לבטל חסימת תוכן/פרטיות זמנית לכתובת הזאת, ולנסות שוב בעוד רגע.',
          );
          return false;
        case 'client_misconfigured':
          setSubmitError(hebrewSupabaseMisconfigurationHint(result.misconfiguration));
          return false;
        case 'redirect_not_allowed':
          setSubmitError(
            'כתובת האתר שממנה נפתחה ההתחברות לא מאושרת ב־Supabase. ב־Dashboard: Authentication → URL Configuration → Redirect URLs — יש להוסיף את כתובת האתר המלאה (כולל תצוגות Vercel אם צריך), ואז לנסות שוב.',
          );
          return false;
        default:
          setSubmitError('קיבלנו תשובה לא צפויה מהשרת. אם זה חוזר, כדאי לרענן את העמוד ולנסות שוב.');
          return false;
      }
    }

    setEmailSendFailureCode(null);
    setFailedAttempts(0);
    setResendCooldown(result.retryAfterSeconds ?? 60);
    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailValidation.isValid) {
      setEmailSendFailureCode('invalid_email');
      if (emailValidation.code === 'required') {
        setSubmitError('צריך להזין כתובת אימייל כדי להמשיך.');
      } else {
        setSubmitError('צריך להזין כתובת אימייל תקינה כדי להמשיך.');
      }
      return;
    }

    setLoadingPhase('sending');
    setSubmitError(null);
    setEmailSendFailureCode(null);

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
    setEmailSendFailureCode(null);

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
    if (code.length < 6 || code.length > 8) {
      setSubmitError('צריך להזין את הקוד מהמייל (בדרך כלל 6 ספרות).');
      return;
    }

    setLoadingPhase('verifying');
    setSubmitError(null);
    setEmailSendFailureCode(null);

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
    setEmailSendFailureCode(null);
  }

  const emailSendBannerTitle =
    emailSendFailureCode === 'network'
      ? 'בעיה זמנית בחיבור'
      : emailSendFailureCode === 'invalid_email'
        ? 'כתובת האימייל לא מתאימה'
        : emailSendFailureCode === 'client_misconfigured'
          ? 'בעיה בהגדרת השרת'
          : emailSendFailureCode === 'redirect_not_allowed'
            ? 'כתובת האתר לא מאושרת'
            : 'לא הצלחנו לשלוח קוד אימות';

  return (
    <PageShell
      title="כניסה לאזור האישי"
      subtitle="נשלח לך קוד חד-פעמי למייל, ואחרי האימות נחזיר אותך בדיוק למקום שממנו רצית להמשיך."
    >
      {submitError && step === 'email' ? (
        <div className="mb-4">
          <RouteErrorState title={emailSendBannerTitle} body={submitError} />
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <Card className={tokens.card.accent}>
          <CardHeader>
            <CardTitle className="text-2xl">התחברות עם קוד למייל</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-foreground/85 leading-relaxed">
            <p>
              בלי סיסמה קבועה: נשלח אליכם מייל עם קוד קצר לזיהוי (לא קישור בלבד). מזינים את הקוד כאן וממשיכים
              ישר ליעד ששמרנו עבורכם.
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
                  <p>מזינים כאן את הקוד מהמייל (שורה אחת, בלי רווחים), ואז לוחצים על האימות.</p>
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
                      maxLength={8}
                      value={otpCode}
                      onChange={(e) => {
                        const nextValue = e.target.value.replace(/\D/g, '').slice(0, 8);
                        setOtpCode(nextValue);
                      }}
                      className="w-full rounded-full border border-input bg-background px-4 py-3 text-center text-lg tracking-[0.35em] outline-none"
                      placeholder="······"
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
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loadingPhase !== null || otpCode.length < 6 || isOtpExpired}
                    >
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
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-full border border-input bg-background px-4 py-3 text-sm outline-none"
                    placeholder=""
                    aria-describedby="auth-email-hint"
                  />
                  <p id="auth-email-hint" className="text-xs text-muted-foreground">
                    כתובת שאליה יגיע קוד קצר לאימות (לא קישור בלבד).
                  </p>
                </div>

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
            <p>1. מזינים אימייל ומקבלים במייל קוד לאימות.</p>
            <p>2. מזינים את הקוד כאן — לא לוחצים על קישור במייל (אין צורך).</p>
            <p>3. אחרי האימות חוזרים ליעד ששמרנו (הגשה, דשבורד וכו׳).</p>
            <Button asChild variant="outline">
              <Link to="/events">חזרה למפגשים</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
