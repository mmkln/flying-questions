const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export function createAnchorIcon() {
  const icon = document.createElementNS(SVG_NAMESPACE, 'svg');
  const stem = document.createElementNS(SVG_NAMESPACE, 'path');
  const stock = document.createElementNS(SVG_NAMESPACE, 'path');
  const crown = document.createElementNS(SVG_NAMESPACE, 'path');
  const arms = document.createElementNS(SVG_NAMESPACE, 'path');

  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.setAttribute('aria-hidden', 'true');

  stem.setAttribute('d', 'M12 2v15');
  stock.setAttribute('d', 'M8 5h8');
  crown.setAttribute('d', 'M5 10h14');
  arms.setAttribute('d', 'M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8');

  icon.append(stem, stock, crown, arms);
  return icon;
}
