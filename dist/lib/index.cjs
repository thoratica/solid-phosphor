'use strict';

var web = require('solid-js/web');

const IconTemplate = (path, {
  ref,
  alt,
  size,
  color,
  ...props
}) => {
  return web.ssrElement("svg", web.mergeProps({
    xmlns: 'https://www.w3.org/2000/svg',
    width: size ?? 16,
    height: size ?? 16,
    fill: color ?? 'currentColor',
    viewBox: '0 0 256 256'
  }, props, {
    innerHTML: path
  }), undefined, true);
};

exports.IconTemplate = IconTemplate;
