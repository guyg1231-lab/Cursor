import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

import { Button, type ButtonProps } from '@/components/ui/button';

export type RouterLinkButtonProps = Omit<ButtonProps, 'asChild'> & {
  to: LinkProps['to'];
};

/** Ghost nav CTA: `Button` + react-router `Link` without repeating `asChild`. */
export function RouterLinkButton({ to, children, ...buttonProps }: RouterLinkButtonProps) {
  return (
    <Button asChild {...buttonProps}>
      <Link to={to}>{children}</Link>
    </Button>
  );
}
