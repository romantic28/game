// Fit the fixed portrait layout inside the current logical stage, including IDE preview.
export function fitPortrait(width: number, height: number) {
    const scale = Math.min(width / 600, height / 1000);
    return { scale, x: (width - 600 * scale) / 2, y: (height - 1000 * scale) / 2 };
}
