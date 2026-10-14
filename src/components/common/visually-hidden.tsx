import type { HTMLAttributes } from 'react';

export function VisuallyHidden(props: HTMLAttributes<HTMLSpanElement>) {
  return <span className="sr-only" {...props} />;
}
