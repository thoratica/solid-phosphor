import type { ComponentProps } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';
export interface IconProps extends ComponentProps<'svg'> {
    color?: string;
    size?: number | string;
    alt?: string;
}
export type PhosphorIcon = (props: IconProps) => JSX.Element;
export declare const IconTemplate: (path: string, { ref, alt, size, color, ...props }: IconProps) => JSX.Element;
