/**
 * WCAG 2.x contrast ratio between two CSS colours, resolved inside
 * `context`: light-dark() picks by the context's color-scheme.
 */
export function contrastRatio(a: string, b: string, context: Element = document.body): number {
  const [la, lb] = [luminance(a, context), luminance(b, context)].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
}

function luminance(color: string, context: Element): number {
  const [r, g, b] = toRgb(color, context).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Let the browser resolve the colour where it is used (light-dark() needs
// the context's color-scheme), then paint it on a 1x1 canvas and read the
// pixel. Computed colours come back as rgb(), color(srgb …) or oklab(…)
// depending on how they were written; the canvas turns any of them into
// 0-255 sRGB.
export function toRgb(color: string, context: Element = document.body): number[] {
  const probe = document.createElement('span');
  probe.style.color = color;
  context.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = resolved;
  ctx.fillRect(0, 0, 1, 1);
  return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}
