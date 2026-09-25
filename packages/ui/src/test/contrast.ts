/** WCAG 2.x contrast ratio between two CSS colours. */
export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
}

function luminance(color: string): number {
  const [r, g, b] = toRgb(color).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Let the browser parse any CSS colour syntax, then read back rgb().
function toRgb(color: string): number[] {
  const probe = document.createElement('span');
  probe.style.color = color;
  document.body.append(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  return rgb.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number);
}
