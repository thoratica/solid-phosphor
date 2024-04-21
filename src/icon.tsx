import type { ComponentProps } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

export interface IconProps extends ComponentProps<'svg'> {
  color?: string;
  size?: number | string;
  alt?: string;
}

export interface BaseIconProps extends IconProps {
  path?: JSX.Element;
}

export const BaseIcon = ({
  ref,
  alt,
  size,
  path,
  color,
  ...props
}: BaseIconProps) => {
  return (
    <svg
      ref={ref}
      xmlns='https://www.w3.org/2000/svg'
      width={size ?? 16}
      height={size ?? 16}
      fill={color ?? 'currentColor'}
      viewBox='0 0 256 256'
      {...props}
    >
      {alt && <title>{alt}</title>}
      {path}
    </svg>
  );
};
