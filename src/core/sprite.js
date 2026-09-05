import { BRUSH_PALETTE } from './constants.js';

/**
 * Escolhe as cores usadas no sprite procedural da IA. Função pura, testável.
 */
export function pickRandomSpriteColors(rng = Math.random) {
  return {
    base: BRUSH_PALETTE[Math.floor(rng() * BRUSH_PALETTE.length)],
  };
}

/**
 * Gera um sprite procedural (círculo + quadrado) para personagens da IA.
 * Depende de `document`/canvas real — não é pura, por isso fica fora da
 * cobertura de teste unitário (ver README).
 */
export function randomSpriteDataUrl(w, h, cellPx, rng = Math.random) {
  const { base } = pickRandomSpriteColors(rng);
  const canvas = document.createElement('canvas');
  canvas.width = w * cellPx;
  canvas.height = h * cellPx;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6);
  return canvas.toDataURL();
}

/**
 * Gira um sprite 90° (usado ao "Girar" um personagem no posicionamento: a
 * pegada w/h troca de lugar, e o desenho precisa girar junto para não ficar
 * esticado/comprimido). Depende de `Image`/canvas real — não é pura.
 */
export function rotateSpriteDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL());
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
