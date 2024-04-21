import type { ComponentProps } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

export interface IconProps extends ComponentProps<'svg'> {
  color?: string;
  size?: number | string;
  alt?: string;
}

export type PhosphorIcon = (props: IconProps) => JSX.Element;

export const IconTemplate = (
  path: string,
  { ref, alt, size, color, ...props }: IconProps,
) => {
  return (
    <svg
      ref={ref}
      xmlns='https://www.w3.org/2000/svg'
      width={size ?? 16}
      height={size ?? 16}
      fill={color ?? 'currentColor'}
      viewBox='0 0 256 256'
      {...props}
      innerHTML={path}
    />
  );
};
