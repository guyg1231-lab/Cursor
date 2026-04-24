import type { SVGProps } from 'react';
import type { EventPresentationKey } from '@/features/events/presentation';

type IconProps = {
  presentationKey: EventPresentationKey;
  className?: string;
};

function IconShell(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props} />
  );
}

function PicnicIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M7.5 9.5V8a4.5 4.5 0 0 1 9 0v1.5" />
      <path d="M5 10.5h14l-1 7a2 2 0 0 1-2 1.7H8a2 2 0 0 1-2-1.7l-1-7Z" />
      <path d="M9.5 7.5V5.8" />
      <path d="M14.5 7.5V5.8" />
    </IconShell>
  );
}

function VolleyballIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="12" r="6.8" />
      <path d="M8.2 6.8c1.8 1.4 2.9 3.3 3.3 5.7" />
      <path d="M15.8 6.8c-1.8 1.4-2.9 3.3-3.3 5.7" />
      <path d="M6.7 12.4c2.2-.2 4.2.2 5.9 1.3" />
      <path d="M17.3 12.4c-2.2-.2-4.2.2-5.9 1.3" />
    </IconShell>
  );
}

function WalkIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M5.5 16.5c2.2-3.2 4.6-4.8 7.1-4.8 2.2 0 4 1 5.9 3" />
      <path d="M10.3 7.2a1.6 1.6 0 1 0 0-.1" />
      <path d="M11.3 8.8l-1.4 4.4" />
      <path d="M13.2 10.4l2.1 2.2" />
      <path d="M9 13.2l-2.2 2.4" />
    </IconShell>
  );
}

function CoffeeIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M7 9.5h7a0 0 0 0 1 0 0V13a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V9.5a0 0 0 0 1 0 0Z" />
      <path d="M14 10.5h1.4a1.9 1.9 0 0 1 0 3.8H14" />
      <path d="M8 18.5h8" />
      <path d="M9.5 7.2c.7-.5.7-1.4 0-2" />
      <path d="M12 7.2c.7-.5.7-1.4 0-2" />
    </IconShell>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M12 5.2l1.3 2.9 2.9 1.3-2.9 1.3L12 13.6l-1.3-2.9-2.9-1.3 2.9-1.3L12 5.2Z" />
      <path d="M7 13.8l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8.8-1.8Z" />
      <path d="M17 13.5l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7.7-1.5Z" />
    </IconShell>
  );
}

function CinemaIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <rect x="5.5" y="7" width="13" height="10" rx="1.8" />
      <path d="M8 7l1.5 10" />
      <path d="M12 7l1.5 10" />
      <path d="M16 7l1.5 10" />
    </IconShell>
  );
}

function DefaultIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 8.8v6.4" />
      <path d="M8.8 12h6.4" />
    </IconShell>
  );
}

export function EventPresentationIcon({ presentationKey, className }: IconProps) {
  switch (presentationKey) {
    case 'picnic':
      return <PicnicIcon className={className} />;
    case 'beach-volleyball':
      return <VolleyballIcon className={className} />;
    case 'promenade-walk':
      return <WalkIcon className={className} />;
    case 'coffee-square':
      return <CoffeeIcon className={className} />;
    case 'young-house':
      return <SparkIcon className={className} />;
    case 'cinemateque':
      return <CinemaIcon className={className} />;
    default:
      return <DefaultIcon className={className} />;
  }
}
