import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';

export function ApplicationStatusPanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return <PlaceholderPanel title={title} body={body} contractState="mixed" />;
}
