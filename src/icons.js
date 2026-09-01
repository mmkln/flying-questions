const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function createOutlineIcon(elements) {
  const icon = document.createElementNS(SVG_NAMESPACE, 'svg');

  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '1.8');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.setAttribute('aria-hidden', 'true');

  elements.forEach(([tagName, attributes]) => {
    const element = document.createElementNS(SVG_NAMESPACE, tagName);
    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, value);
    });
    icon.append(element);
  });

  return icon;
}

export function createAnchorIcon() {
  return createOutlineIcon([
    ['circle', { cx: '12', cy: '5', r: '3' }],
    ['path', { d: 'M12 8v12' }],
    ['path', { d: 'M5 14a7 7 0 0 0 14 0' }],
    ['path', { d: 'm5 14-2 2M19 14l2 2' }],
  ]);
}

export function createQuestionIcon() {
  return createOutlineIcon([
    ['path', { d: 'M8.8 8.6a3.4 3.4 0 1 1 4.7 3.15C12.45 12.3 12 13.05 12 14.4' }],
    ['path', { d: 'M12 18.5h.01' }],
  ]);
}
