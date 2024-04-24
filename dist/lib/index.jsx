export const IconTemplate = (path, { ref, alt, size, color, ...props }) => {
    return (<svg ref={ref} xmlns='https://www.w3.org/2000/svg' width={size ?? 16} height={size ?? 16} fill={color ?? 'currentColor'} viewBox='0 0 256 256' {...props} innerHTML={path}/>);
};
