import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { normalizePhone, validateEmailAddress } from '@/lib/validation';
import { safeLocalStorage } from '@/lib/safeStorage';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { getSocialPlatformLabel, isValidProfileSocialUrl } from '@/lib/socialLinkValidation';
import { tokens } from '@/lib/design-tokens';

const STORAGE_KEY = 'social-matching-profile-base-draft-v2';

/** Stable DOM ids so `<label htmlFor>` pairs with inputs (a11y + Playwright getByLabel). */
const PROFILE_Q_IDS = {
  full_name: 'pq-full_name',
  email: 'pq-email',
  phone: 'pq-phone',
  social_link: 'pq-social_link',
  birth_date: 'pq-birth_date',
  current_place: 'pq-current_place',
  origin_place: 'pq-origin_place',
  q26_about_you: 'pq-q26_about_you',
  q27_comfort_needs: 'pq-q27_comfort_needs',
} as const;

const copy = {
  he: {
    introEyebrow: 'שלב ראשון: להכיר אותך נכון',
    introTitle: 'כמה שאלות שיעזרו לנו לבנות קבוצה שמרגישה יותר נכונה',
    introBody:
      'המטרה כאן היא לא לדרג אותך, אלא להבין איך לעזור לך להיכנס למפגש קטן בצורה שנעימה יותר, ברורה יותר, ופחות רנדומלית.',
    identityTitle: 'זהות ואמון',
    identityBody:
      'אלו הפרטים הבסיסיים שיעזרו לנו לזהות אותך, לעדכן אותך, ולוודא שהתהליך מרגיש אחראי ומכבד.',
    fitTitle: 'התאמה ושייכות',
    fitBody:
      'כאן אנחנו מתחילים להבין איזה סוג קבוצה יכול להרגיש לך יותר נכון, ואיזה הקשרים יכולים לעזור לייצר יותר נוחות וחיבור.',
    comfortTitle: 'קצת עלייך',
    comfortBody:
      'כמה פרטים שיעזרו לנו להרגיש אותך מעבר לשדות יבשים, ולדעת אם יש משהו שחשוב לנו לקחת בחשבון.',
    whyWeAskSocial: 'הקישור לא יוצג למשתתפים אחרים — הוא משמש רק לאימות זהות על ידי הצוות.',
    whyWeAskOrigin:
      'הרקע הגיאוגרפי שלך יכול לעזור לנו לבנות קבוצה עם יותר תחושת שייכות, היכרות, או גיוון נכון.',
    whyWeAskAboutYou: '2–5 שורות מספיקות. לא צריך להרשים — רק לעזור לנו להבין אותך קצת יותר טוב.',
    section: 'חלק',
    back: 'חזרה',
    next: 'המשך',
    saveDraft: 'שמירת טיוטה',
    submit: 'שמירת פרופיל',
    saving: 'שומר...',
    saveLocalOnly: 'הטיוטה נשמרה מקומית. כשתהיה/י מחובר/ת נוכל גם לשמור אותה לענן.',
    saveSuccess: 'הפרופיל נשמר בהצלחה.',
    saveDraftSuccess: 'הטיוטה נשמרה.',
    loadRemoteError: 'לא הצלחנו לטעון כרגע את הנתונים השמורים.',
    submitError: 'לא הצלחנו לשמור כרגע. אפשר לנסות שוב.',
    requiredField: 'כדי להמשיך צריך להשלים את השדה הזה.',
    selectAtLeastOne: 'בחר/י לפחות אפשרות אחת.',
    selectUpToTwo: 'אפשר לבחור עד שתי אפשרויות.',
    socialInvalid: 'נדרש קישור תקין לפרופיל חברתי.',
    emailInvalid: 'נדרש אימייל תקין.',
    phoneInvalid: 'נדרש מספר נייד תקין.',
    aboutTooShort: 'כדאי לכתוב לפחות כמה מילים כדי שנכיר אותך קצת יותר טוב.',
    placeholders: {
      full_name: 'השם המלא שלך',
      email: 'name@example.com',
      social_link: 'https://instagram.com/your-profile',
      birth_date: '',
      current_place: 'למשל: תל אביב',
      origin_place: 'למשל: חיפה / פריז / באר שבע',
      q26_about_you: 'מה חשוב שנדע עלייך? מה מעניין, מאפיין, או ירגיש נכון לשתף?',
      q27_comfort_needs: 'אם יש משהו שיעזור לנו לוודא שתרגיש/י בנוח, אפשר לכתוב כאן.',
    },
    labels: {
      full_name: 'שם מלא',
      email: 'אימייל',
      phone: 'טלפון',
      social_link: 'קישור לפרופיל חברתי',
      birth_date: 'תאריך לידה',
      current_place: 'איפה את/ה גר/ה היום?',
      origin_place: 'מאיפה את/ה במקור?',
      language_pref: 'מה השפה שהכי נוחה לך במפגשים?',
      q22_interests: 'מה התחומים שמעניינים אותך?',
      q13_social_style: 'במפגש עם אנשים חדשים, מה הכי מתאר אותך?',
      q17_recharge: 'אחרי תקופה עמוסה, איך הכי מתאים לך להיטען?',
      q20_meeting_priority: 'מה הכי חשוב לך כשאת/ה מכיר/ה אנשים חדשים?',
      q_match_preference: 'איזה סוג שילוב יותר נכון לך בקבוצה?',
      q25_motivation: 'מה את/ה מחפש/ת דרך המפגשים האלה?',
      q26_about_you: 'ספר/י לנו בקצרה על עצמך',
      q27_comfort_needs: 'יש משהו שיעזור לנו לוודא שתרגיש/י בנוח במפגש?',
    },
  },
  en: {
    introEyebrow: 'Step one: get to know you',
    introTitle: 'A few questions to help us build a group that feels more right',
    introBody:
      'This is not about scoring you. It is about helping us place you into a small gathering that feels clearer, safer, and less random.',
    identityTitle: 'Identity and trust',
    identityBody:
      'These details help us know who you are, contact you responsibly, and keep the process thoughtful and trustworthy.',
    fitTitle: 'Fit and belonging',
    fitBody:
      'This is where we start to understand what kind of group may feel right for you, and what context could support comfort and connection.',
    comfortTitle: 'A little about you',
    comfortBody:
      'A few details that help us understand you beyond dry fields, and know if there is anything important to take into account.',
    whyWeAskSocial: 'This is not shown to other participants. It is used only for identity verification by the team.',
    whyWeAskOrigin:
      'Your geographic background can help us build a group with more belonging, familiarity, or the right kind of diversity.',
    whyWeAskAboutYou: '2–5 lines are enough. No need to impress us — just help us get a better sense of you.',
    section: 'Section',
    back: 'Back',
    next: 'Continue',
    saveDraft: 'Save draft',
    submit: 'Save profile',
    saving: 'Saving...',
    saveLocalOnly: 'Draft saved locally. Once you are signed in, we can also save it to the cloud.',
    saveSuccess: 'Profile saved successfully.',
    saveDraftSuccess: 'Draft saved.',
    loadRemoteError: 'Could not load your saved data right now.',
    submitError: 'Could not save right now. Please try again.',
    requiredField: 'This field is required to continue.',
    selectAtLeastOne: 'Select at least one option.',
    selectUpToTwo: 'You can select up to two options.',
    socialInvalid: 'A valid social profile link is required.',
    emailInvalid: 'A valid email is required.',
    phoneInvalid: 'A valid mobile phone number is required.',
    aboutTooShort: 'Please write a few words so we can understand you a bit better.',
    placeholders: {
      full_name: 'Your full name',
      email: 'name@example.com',
      social_link: 'https://instagram.com/your-profile',
      birth_date: '',
      current_place: 'For example: Tel Aviv',
      origin_place: 'For example: Haifa / Paris / Be’er Sheva',
      q26_about_you: 'What would help us get a better sense of who you are?',
      q27_comfort_needs: 'If there is something that would help you feel comfortable, you can share it here.',
    },
    labels: {
      full_name: 'Full name',
      email: 'Email',
      phone: 'Phone',
      social_link: 'Social profile link',
      birth_date: 'Birth date',
      current_place: 'Where do you live today?',
      origin_place: 'Where are you originally from?',
      language_pref: 'What language setup feels most comfortable to you?',
      q22_interests: 'Which topics or worlds interest you?',
      q13_social_style: 'In a gathering with new people, what best describes you?',
      q17_recharge: 'After an intense period, how do you usually recharge best?',
      q20_meeting_priority: 'What matters most to you when meeting new people?',
      q_match_preference: 'What kind of mix feels more right for you in a group?',
      q25_motivation: 'What are you looking for through these gatherings?',
      q26_about_you: 'Tell us a little about yourself',
      q27_comfort_needs: 'Is there anything that would help us make sure you feel comfortable?',
    },
  },
} as const;

const interestOptions = [
  'Music',
  'Art',
  'Books',
  'Film',
  'Philosophy / ideas',
  'Nature / outdoors',
  'Movement / sports',
  'Food / culinary',
  'Community / people',
  'Entrepreneurship / career',
  'Technology',
  'Games',
  'Urban culture',
  'Personal growth',
] as const;

const socialStyleOptions = ['Initiator', 'Connector', 'Flexible', 'Listener'] as const;
const rechargeOptions = ['With people', 'Alone', 'A mix of both'] as const;
const meetingPriorityOptions = [
  'Light and enjoyable conversation',
  'Feeling heard',
  'Meeting people different from me',
  'Feeling comfortable and opening up gradually',
] as const;
const languageOptions = ['Hebrew', 'Hebrew + English is fine', 'Comfortable in English', 'English only'] as const;
const matchPreferenceOptions = ['People more similar to me', 'People more different from me', 'A mix of both'] as const;
const motivationOptions = ['Meet new people', 'Break routine', 'Build meaningful connections', 'Try a new kind of experience'] as const;

const interestDisplayLabels: Record<(typeof interestOptions)[number], string> = {
  Music: 'מוזיקה',
  Art: 'אומנות',
  Books: 'ספרים',
  Film: 'קולנוע',
  'Philosophy / ideas': 'פילוסופיה / רעיונות',
  'Nature / outdoors': 'טבע / טיולים',
  'Movement / sports': 'תנועה / ספורט',
  'Food / culinary': 'אוכל / קולינריה',
  'Community / people': 'קהילה / אנשים',
  'Entrepreneurship / career': 'יזמות / קריירה',
  Technology: 'טכנולוגיה',
  Games: 'משחקים',
  'Urban culture': 'תרבות עירונית',
  'Personal growth': 'צמיחה אישית',
};

const socialStyleDisplayLabels: Record<(typeof socialStyleOptions)[number], string> = {
  Initiator: 'יוזם/ת',
  Connector: 'מחבר/ת',
  Flexible: 'גמיש/ה',
  Listener: 'מקשיב/ה',
};

const rechargeDisplayLabels: Record<(typeof rechargeOptions)[number], string> = {
  'With people': 'עם אנשים',
  Alone: 'לבד',
  'A mix of both': 'שילוב של שניהם',
};

const meetingPriorityDisplayLabels: Record<(typeof meetingPriorityOptions)[number], string> = {
  'Light and enjoyable conversation': 'שיחה קלה ונעימה',
  'Feeling heard': 'תחושה שמקשיבים',
  'Meeting people different from me': 'להכיר אנשים שונים ממני',
  'Feeling comfortable and opening up gradually': 'להרגיש בנוח ולהיפתח בהדרגה',
};

const languageDisplayLabels: Record<(typeof languageOptions)[number], string> = {
  Hebrew: 'עברית',
  'Hebrew + English is fine': 'עברית + אנגלית זה בסדר',
  'Comfortable in English': 'נוח באנגלית',
  'English only': 'אנגלית בלבד',
};

const matchPreferenceDisplayLabels: Record<(typeof matchPreferenceOptions)[number], string> = {
  'People more similar to me': 'אנשים דומים לי',
  'People more different from me': 'אנשים שונים ממני',
  'A mix of both': 'שילוב של שניהם',
};

const motivationDisplayLabels: Record<(typeof motivationOptions)[number], string> = {
  'Meet new people': 'להכיר אנשים חדשים',
  'Break routine': 'לשבור שגרה',
  'Build meaningful connections': 'לבנות קשרים משמעותיים',
  'Try a new kind of experience': 'לנסות חוויה חדשה',
};

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  social_link: string;
  birth_date: string;
  current_place: string;
  origin_place: string;
  language_pref: string;
  q22_interests: string[];
  q13_social_style: string;
  q17_recharge: string;
  q20_meeting_priority: string[];
  q_match_preference: string;
  q25_motivation: string;
  q26_about_you: string;
  q27_comfort_needs: string;
};

const INITIAL_STATE: FormState = {
  full_name: '',
  email: '',
  phone: '',
  social_link: '',
  birth_date: '',
  current_place: '',
  origin_place: '',
  language_pref: '',
  q22_interests: [],
  q13_social_style: '',
  q17_recharge: '',
  q20_meeting_priority: [],
  q_match_preference: '',
  q25_motivation: '',
  q26_about_you: '',
  q27_comfort_needs: '',
};

function readDraft(): FormState {
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<FormState>;
    return { ...INITIAL_STATE, ...parsed };
  } catch {
    return INITIAL_STATE;
  }
}

function ChoiceChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 text-sm transition-all duration-200',
        selected
          ? 'border-primary bg-primary/10 text-primary shadow-sm'
          : 'border-border bg-background/30 text-foreground/80 hover:border-primary/30 hover:bg-primary/5',
      )}
    >
      {children}
    </button>
  );
}

function FieldLabel({ title, hint, htmlFor }: { title: string; hint?: string; htmlFor?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {title}
      </label>
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type ProfileBaseQuestionnaireProps = {
  onLoadError?: (hasError: boolean) => void;
  onSaved?: () => void;
};

export function ProfileBaseQuestionnaire({ onLoadError, onSaved }: ProfileBaseQuestionnaireProps = {}) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const text = copy[language];

  const [form, setForm] = useState<FormState>(readDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadedRemote, setLoadedRemote] = useState(false);

  useEffect(() => {
    if (!user || loadedRemote) return;

    let active = true;

    supabase
      .from('matching_responses')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (!active) return;
        if (fetchError) {
          setError(text.loadRemoteError);
          onLoadError?.(true);
          setLoadedRemote(true);
          return;
        }

        if (data) {
          setForm((prev) => ({
            ...prev,
            full_name: data.full_name ?? prev.full_name,
            email: data.email ?? prev.email,
            phone: data.phone ?? prev.phone,
            social_link: data.social_link ?? prev.social_link,
            birth_date: data.birth_date ?? prev.birth_date,
            current_place: data.current_place ?? prev.current_place,
            origin_place: data.origin_place ?? prev.origin_place,
            language_pref: data.language_pref ?? prev.language_pref,
            q22_interests: data.q22_interests ?? prev.q22_interests,
            q13_social_style: data.q13_social_style ?? prev.q13_social_style,
            q17_recharge: data.q17_recharge ?? prev.q17_recharge,
            q20_meeting_priority: data.q20_meeting_priority ?? prev.q20_meeting_priority,
            q_match_preference: data.q_match_preference ?? prev.q_match_preference,
            q25_motivation: data.q25_motivation ?? prev.q25_motivation,
            q26_about_you: data.q26_about_you ?? prev.q26_about_you,
            q27_comfort_needs: data.q27_comfort_needs ?? prev.q27_comfort_needs,
          }));
        }

        onLoadError?.(false);
        setLoadedRemote(true);
      });

    return () => {
      active = false;
    };
  }, [loadedRemote, text.loadRemoteError, user]);

  const sections = useMemo(
    () => [
      {
        key: 'identity',
        title: text.identityTitle,
        body: text.identityBody,
      },
      {
        key: 'fit',
        title: text.fitTitle,
        body: text.fitBody,
      },
      {
        key: 'comfort',
        title: text.comfortTitle,
        body: text.comfortBody,
      },
    ],
    [text.comfortBody, text.comfortTitle, text.fitBody, text.fitTitle, text.identityBody, text.identityTitle],
  );

  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (!form.full_name.trim()) return text.requiredField;
      if (!validateEmailAddress(form.email).isValid) return text.emailInvalid;
      if (!/^05\d{8}$/.test(normalizePhone(form.phone))) return text.phoneInvalid;
      if (!isValidProfileSocialUrl(form.social_link)) return text.socialInvalid;
      if (!form.birth_date.trim()) return text.requiredField;
      return null;
    }

    if (index === 1) {
      if (!form.current_place.trim()) return text.requiredField;
      if (!form.origin_place.trim()) return text.requiredField;
      if (!form.language_pref.trim()) return text.requiredField;
      if (form.q22_interests.length < 1) return text.selectAtLeastOne;
      if (!form.q13_social_style.trim()) return text.requiredField;
      if (!form.q17_recharge.trim()) return text.requiredField;
      if (form.q20_meeting_priority.length < 1) return text.selectAtLeastOne;
      if (!form.q_match_preference.trim()) return text.requiredField;
      if (!form.q25_motivation.trim()) return text.requiredField;
      return null;
    }

    if (index === 2) {
      if (form.q26_about_you.trim().length < 20) return text.aboutTooShort;
      return null;
    }

    return null;
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const toggleMulti = (key: 'q22_interests' | 'q20_meeting_priority', value: string, max: number) => {
    setForm((prev) => {
      const current = prev[key];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((item) => item !== value) };
      }
      if (current.length >= max) {
        setError(max === 2 ? text.selectUpToTwo : text.selectAtLeastOne);
        return prev;
      }
      return { ...prev, [key]: [...current, value] };
    });
  };

  const saveDraft = async () => {
    setError(null);
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(form));

    if (user) {
      await supabase
        .from('profiles')
        .update({ questionnaire_draft: form as unknown as never })
        .eq('id', user.id);
    }

    setMessage(user ? text.saveDraftSuccess : text.saveLocalOnly);
    window.setTimeout(() => setMessage(null), 2200);
  };

  const persistProfile = async () => {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(form));

      if (!user) {
        setMessage(text.saveLocalOnly);
        return;
      }

      const platformLabel = getSocialPlatformLabel(form.social_link);
      const social_link_platform =
        platformLabel === 'Instagram'
          ? 'instagram'
          : platformLabel === 'Facebook'
            ? 'facebook'
            : platformLabel === 'LinkedIn'
              ? 'linkedin'
              : 'other';

      await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          email: form.email,
          phone: normalizePhone(form.phone),
          preferred_language: language,
          questionnaire_draft: null,
        })
        .eq('id', user.id);

      const { error: upsertError } = await supabase.from('matching_responses').upsert(
        {
          user_id: user.id,
          full_name: form.full_name,
          email: form.email,
          phone: normalizePhone(form.phone),
          social_link: form.social_link,
          social_link_platform,
          birth_date: form.birth_date,
          current_place: form.current_place,
          origin_place: form.origin_place,
          language_pref: form.language_pref,
          q22_interests: form.q22_interests,
          q13_social_style: form.q13_social_style,
          q17_recharge: form.q17_recharge,
          q20_meeting_priority: form.q20_meeting_priority,
          q_match_preference: form.q_match_preference,
          q25_motivation: form.q25_motivation,
          q26_about_you: form.q26_about_you,
          q27_comfort_needs: form.q27_comfort_needs || null,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

      if (upsertError) {
        throw upsertError;
      }

      setMessage(text.saveSuccess);
      onSaved?.();
    } catch {
      setError(text.submitError);
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setMessage(null), 2200);
    }
  };

  const nextStep = async () => {
    const stepError = validateStep(stepIndex);
    if (stepError) {
      setError(stepError);
      return;
    }

    if (stepIndex === sections.length - 1) {
      await persistProfile();
      return;
    }

    setStepIndex((prev) => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="space-y-6">
      <Card className={tokens.card.accent}>
        <CardHeader className="space-y-3">
          <p className={tokens.typography.eyebrow}>{text.introEyebrow}</p>
          <CardTitle className="text-2xl md:text-3xl leading-tight">{text.introTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm md:text-base text-foreground/85 leading-relaxed">
          <p>{text.introBody}</p>
          <div className={tokens.card.inner + ' p-4 space-y-3'}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {text.section} {stepIndex + 1} / {sections.length}
              </span>
              <span>{sections[stepIndex].title}</span>
            </div>
            <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${((stepIndex + 1) / sections.length) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={tokens.card.surface}>
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl md:text-2xl">{sections[stepIndex].title}</CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">{sections[stepIndex].body}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {stepIndex === 0 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <FieldLabel title={text.labels.full_name} htmlFor={PROFILE_Q_IDS.full_name} />
                <input
                  id={PROFILE_Q_IDS.full_name}
                  type="text"
                  value={form.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  className="w-full rounded-full border border-input bg-background/30 px-4 py-3 text-sm outline-none"
                  placeholder={text.placeholders.full_name}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel title={text.labels.email} htmlFor={PROFILE_Q_IDS.email} />
                <input
                  id={PROFILE_Q_IDS.email}
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full rounded-full border border-input bg-background/30 px-4 py-3 text-sm outline-none"
                  placeholder={text.placeholders.email}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel title={text.labels.phone} htmlFor={PROFILE_Q_IDS.phone} />
                <PhoneInput id={PROFILE_Q_IDS.phone} value={form.phone} onChange={(value) => updateField('phone', value)} />
              </div>

              <div className="space-y-2">
                <FieldLabel title={text.labels.social_link} hint={text.whyWeAskSocial} htmlFor={PROFILE_Q_IDS.social_link} />
                <input
                  id={PROFILE_Q_IDS.social_link}
                  type="url"
                  value={form.social_link}
                  onChange={(e) => updateField('social_link', e.target.value)}
                  className="w-full rounded-full border border-input bg-background/30 px-4 py-3 text-sm outline-none"
                  placeholder={text.placeholders.social_link}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel title={text.labels.birth_date} htmlFor={PROFILE_Q_IDS.birth_date} />
                <input
                  id={PROFILE_Q_IDS.birth_date}
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => updateField('birth_date', e.target.value)}
                  className="w-full rounded-full border border-input bg-background/30 px-4 py-3 text-sm outline-none"
                  placeholder={text.placeholders.birth_date}
                />
              </div>
            </div>
          ) : null}

          {stepIndex === 1 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <FieldLabel title={text.labels.current_place} htmlFor={PROFILE_Q_IDS.current_place} />
                <input
                  id={PROFILE_Q_IDS.current_place}
                  type="text"
                  value={form.current_place}
                  onChange={(e) => updateField('current_place', e.target.value)}
                  className="w-full rounded-full border border-input bg-background/30 px-4 py-3 text-sm outline-none"
                  placeholder={text.placeholders.current_place}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel title={text.labels.origin_place} hint={text.whyWeAskOrigin} htmlFor={PROFILE_Q_IDS.origin_place} />
                <input
                  id={PROFILE_Q_IDS.origin_place}
                  type="text"
                  value={form.origin_place}
                  onChange={(e) => updateField('origin_place', e.target.value)}
                  className="w-full rounded-full border border-input bg-background/30 px-4 py-3 text-sm outline-none"
                  placeholder={text.placeholders.origin_place}
                />
              </div>

              <div className="space-y-3">
                <FieldLabel title={text.labels.language_pref} />
                <div className="flex flex-wrap gap-2">
                  {languageOptions.map((option) => (
                    <ChoiceChip
                      key={option}
                      selected={form.language_pref === option}
                      onClick={() => updateField('language_pref', option)}
                    >
                      {languageDisplayLabels[option]}
                    </ChoiceChip>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <FieldLabel title={text.labels.q22_interests} />
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((option) => (
                    <ChoiceChip
                      key={option}
                      selected={form.q22_interests.includes(option)}
                      onClick={() => toggleMulti('q22_interests', option, 5)}
                    >
                      {interestDisplayLabels[option]}
                    </ChoiceChip>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <FieldLabel title={text.labels.q13_social_style} />
                <div className="flex flex-wrap gap-2">
                  {socialStyleOptions.map((option) => (
                    <ChoiceChip
                      key={option}
                      selected={form.q13_social_style === option}
                      onClick={() => updateField('q13_social_style', option)}
                    >
                      {socialStyleDisplayLabels[option]}
                    </ChoiceChip>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <FieldLabel title={text.labels.q17_recharge} />
                <div className="flex flex-wrap gap-2">
                  {rechargeOptions.map((option) => (
                    <ChoiceChip
                      key={option}
                      selected={form.q17_recharge === option}
                      onClick={() => updateField('q17_recharge', option)}
                    >
                      {rechargeDisplayLabels[option]}
                    </ChoiceChip>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <FieldLabel title={text.labels.q20_meeting_priority} hint={text.selectUpToTwo} />
                <div className="flex flex-wrap gap-2">
                  {meetingPriorityOptions.map((option) => (
                    <ChoiceChip
                      key={option}
                      selected={form.q20_meeting_priority.includes(option)}
                      onClick={() => toggleMulti('q20_meeting_priority', option, 2)}
                    >
                      {meetingPriorityDisplayLabels[option]}
                    </ChoiceChip>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <FieldLabel title={text.labels.q_match_preference} />
                <div className="flex flex-wrap gap-2">
                  {matchPreferenceOptions.map((option) => (
                    <ChoiceChip
                      key={option}
                      selected={form.q_match_preference === option}
                      onClick={() => updateField('q_match_preference', option)}
                    >
                      {matchPreferenceDisplayLabels[option]}
                    </ChoiceChip>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <FieldLabel title={text.labels.q25_motivation} />
                <div className="flex flex-wrap gap-2">
                  {motivationOptions.map((option) => (
                    <ChoiceChip
                      key={option}
                      selected={form.q25_motivation === option}
                      onClick={() => updateField('q25_motivation', option)}
                    >
                      {motivationDisplayLabels[option]}
                    </ChoiceChip>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {stepIndex === 2 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <FieldLabel title={text.labels.q26_about_you} hint={text.whyWeAskAboutYou} htmlFor={PROFILE_Q_IDS.q26_about_you} />
                <textarea
                  id={PROFILE_Q_IDS.q26_about_you}
                  value={form.q26_about_you}
                  onChange={(e) => updateField('q26_about_you', e.target.value)}
                  className="min-h-[180px] w-full rounded-3xl border border-input bg-background/30 px-4 py-3 text-sm outline-none"
                  placeholder={text.placeholders.q26_about_you}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel title={text.labels.q27_comfort_needs} htmlFor={PROFILE_Q_IDS.q27_comfort_needs} />
                <textarea
                  id={PROFILE_Q_IDS.q27_comfort_needs}
                  value={form.q27_comfort_needs}
                  onChange={(e) => updateField('q27_comfort_needs', e.target.value)}
                  className="min-h-[140px] w-full rounded-3xl border border-input bg-background/30 px-4 py-3 text-sm outline-none"
                  placeholder={text.placeholders.q27_comfort_needs}
                />
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-primary">{message}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button variant="outline" onClick={prevStep} disabled={stepIndex === 0 || isSaving}>
              {text.back}
            </Button>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={saveDraft} disabled={isSaving}>
                {text.saveDraft}
              </Button>
              <Button variant="primary" onClick={() => void nextStep()} disabled={isSaving}>
                {isSaving ? text.saving : stepIndex === sections.length - 1 ? text.submit : text.next}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
