<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { BRUSH_PALETTE, BRUSH_SIZES, MOBILE_BREAKPOINT, PAINT_CANVAS_SIZE_DESKTOP, PAINT_CANVAS_SIZE_MOBILE, PAINT_TOOLS } from '../../core/constants.js';

const props = defineProps({
  // dataURL de um sprite já existente (edição de personagem) para pré-carregar no canvas
  initialImage: { type: String, default: null },
  charW: { type: Number, required: true },
  charH: { type: Number, required: true },
});

// Bounding box fixo, calculado uma única vez (evita layout pulando ao
// redimensionar a janela). O canvas em si NUNCA é quadrado por padrão: suas
// dimensões respeitam exatamente a proporção charW:charH do personagem, para
// que o desenho final tenha a mesma proporção do seu tamanho real no campo.
const boundingBoxPx =
  typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
    ? PAINT_CANVAS_SIZE_MOBILE
    : PAINT_CANVAS_SIZE_DESKTOP;

const cellPx = computed(() => Math.floor(boundingBoxPx / Math.max(props.charW, props.charH)));
const canvasWidthPx = computed(() => props.charW * cellPx.value);
const canvasHeightPx = computed(() => props.charH * cellPx.value);

const gridBackgroundStyle = computed(() => ({
  backgroundImage:
    `repeating-linear-gradient(0deg, #16233e, #16233e 1px, #0d1729 1px, #0d1729 ${cellPx.value}px), ` +
    `repeating-linear-gradient(90deg, #16233e, #16233e 1px, #0d1729 1px, #0d1729 ${cellPx.value}px)`,
}));

const canvasRef = ref(null);
const tool = ref('pencil');
const painterColor = ref(BRUSH_PALETTE[0]);
const customColor = ref(BRUSH_PALETTE[0]);
const brushRadius = ref(BRUSH_SIZES[1]);
const fillShape = ref(false);
const eraserIconSize = computed(() => brushRadius.value * 2);

const SHAPE_TOOLS = new Set(['line', 'rectangle', 'circle']);
const FILLABLE_TOOLS = new Set(['rectangle', 'circle']);

// Cursor customizado: uma bolinha (cor atual) para o lápis e um quadrado
// branco para a borracha, ambos do tamanho do pincel selecionado.
function svgCursor(svg, hotspot) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotspot} ${hotspot}, crosshair`;
}

const cursorStyle = computed(() => {
  const diameter = Math.max(6, brushRadius.value * 2);
  const size = diameter + 4;
  const c = size / 2;
  if (tool.value === 'eraser') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect x='2' y='2' width='${diameter}' height='${diameter}' fill='white' fill-opacity='0.7' stroke='black' stroke-width='1'/></svg>`;
    return svgCursor(svg, c);
  }
  if (tool.value === 'pencil') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${c}' cy='${c}' r='${diameter / 2}' fill='${painterColor.value}' fill-opacity='0.6' stroke='white' stroke-width='1'/></svg>`;
    return svgCursor(svg, c);
  }
  return 'crosshair';
});

let painting = false;
let lastPoint = null; // usado pelo lápis/borracha (traço livre)
let startPoint = null; // usado pelas ferramentas de forma (linha/retângulo/círculo)
let snapshot = null; // estado do canvas antes de começar a desenhar uma forma

function blankCanvas() {
  const canvas = canvasRef.value;
  canvas.width = canvasWidthPx.value;
  canvas.height = canvasHeightPx.value;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function initCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  blankCanvas();
  if (props.initialImage) {
    const img = new Image();
    img.onload = () => canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = props.initialImage;
  }
}

onMounted(initCanvas);

// Mudar largura/altura depois de montado (o jogador ajustando o tamanho do
// personagem) precisa redimensionar o canvas — o que, por comportamento
// nativo do <canvas>, sempre limpa o desenho existente. É esperado: manter a
// proporção real charW:charH é o requisito, não preservar o desenho ao
// mudar de tamanho.
watch([() => props.charW, () => props.charH], () => {
  if (canvasRef.value) blankCanvas();
});

function getPos(e) {
  const rect = canvasRef.value.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  return { x: point.clientX - rect.left, y: point.clientY - rect.top };
}

function applyStrokeStyle(ctx) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = painterColor.value;
  ctx.lineWidth = brushRadius.value * 2;
  ctx.globalCompositeOperation = tool.value === 'eraser' ? 'destination-out' : 'source-over';
}

function strokeFreehandTo(point) {
  const ctx = canvasRef.value.getContext('2d');
  applyStrokeStyle(ctx);
  ctx.beginPath();
  if (lastPoint) {
    ctx.moveTo(lastPoint.x, lastPoint.y);
  } else {
    ctx.moveTo(point.x - 0.01, point.y - 0.01);
  }
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  lastPoint = point;
}

function drawShapePreview(from, to) {
  const ctx = canvasRef.value.getContext('2d');
  ctx.putImageData(snapshot, 0, 0);
  applyStrokeStyle(ctx);
  ctx.beginPath();
  if (tool.value === 'line') {
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    return;
  }
  if (tool.value === 'rectangle') {
    ctx.rect(Math.min(from.x, to.x), Math.min(from.y, to.y), Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  } else if (tool.value === 'circle') {
    const cx = (from.x + to.x) / 2;
    const cy = (from.y + to.y) / 2;
    const rx = Math.abs(to.x - from.x) / 2;
    const ry = Math.abs(to.y - from.y) / 2;
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }
  if (fillShape.value) {
    ctx.fillStyle = painterColor.value;
    ctx.fill();
  } else {
    ctx.stroke();
  }
}

function start(e) {
  painting = true;
  const point = getPos(e);
  if (SHAPE_TOOLS.has(tool.value)) {
    startPoint = point;
    const canvas = canvasRef.value;
    snapshot = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  } else {
    lastPoint = null;
    strokeFreehandTo(point);
  }
  e.preventDefault();
}

function move(e) {
  if (!painting) {
    e.preventDefault();
    return;
  }
  const point = getPos(e);
  if (SHAPE_TOOLS.has(tool.value)) {
    drawShapePreview(startPoint, point);
  } else {
    strokeFreehandTo(point);
  }
  e.preventDefault();
}

function end() {
  painting = false;
  lastPoint = null;
  startPoint = null;
  snapshot = null;
}

function pickColor(color) {
  painterColor.value = color;
  if (tool.value === 'eraser') tool.value = 'pencil';
}

function onCustomColor(value) {
  customColor.value = value;
  pickColor(value);
}

function clearCanvas() {
  blankCanvas();
}

function exportDataUrl() {
  return canvasRef.value.toDataURL();
}

// Verifica se existe pelo menos um pixel não-transparente no canvas —
// usado para validar que o jogador realmente desenhou algo antes de
// confirmar o personagem.
function hasContent() {
  const canvas = canvasRef.value;
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return true;
  }
  return false;
}

defineExpose({ exportDataUrl, hasContent });
</script>

<template>
  <div class="sprite-painter">
    <div class="palette">
      <div
        v-for="color in BRUSH_PALETTE"
        :key="color"
        class="swatch"
        :class="{ active: color === painterColor && tool !== 'eraser' }"
        :style="{ background: color }"
        @click="pickColor(color)"
      />
      <input
        type="color"
        class="swatch custom-color"
        :value="customColor"
        title="Escolher outra cor"
        @input="onCustomColor($event.target.value)"
      />
    </div>

    <div class="toolbar">
      <button
        v-for="t in PAINT_TOOLS"
        :key="t.id"
        type="button"
        class="tool-btn"
        :class="{ active: tool === t.id }"
        :title="t.label"
        @click="tool = t.id"
      >
        <span v-if="t.id === 'eraser'" class="eraser-icon" :style="{ width: eraserIconSize + 'px', height: eraserIconSize + 'px' }" />
        {{ t.label }}
      </button>
      <label v-if="FILLABLE_TOOLS.has(tool)" class="fill-toggle">
        <input type="checkbox" v-model="fillShape" />
        Preencher
      </label>
    </div>

    <div class="brush-size">
      Pincel:
      <button
        v-for="size in BRUSH_SIZES"
        :key="size"
        type="button"
        class="small"
        :class="{ active: brushRadius === size }"
        @click="brushRadius = size"
      >
        ●
      </button>
    </div>

    <div
      class="painter-wrap"
      :style="[{ width: canvasWidthPx + 'px', height: canvasHeightPx + 'px' }, gridBackgroundStyle]"
    >
      <canvas
        ref="canvasRef"
        :style="{ cursor: cursorStyle }"
        @mousedown="start"
        @mousemove="move"
        @mouseup="end"
        @mouseleave="end"
        @touchstart="start"
        @touchmove="move"
        @touchend="end"
      />
    </div>
    <button type="button" class="btn secondary" @click="clearCanvas">Limpar desenho</button>
  </div>
</template>

<style scoped>
.sprite-painter {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.palette {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.swatch {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
}

.swatch.active {
  border-color: #fff;
}

.swatch.custom-color {
  padding: 0;
  background: none;
  -webkit-appearance: none;
  appearance: none;
}

.swatch.custom-color::-webkit-color-swatch-wrapper {
  padding: 0;
}

.swatch.custom-color::-webkit-color-swatch {
  border: 2px solid var(--line);
  border-radius: 6px;
}

.swatch.custom-color::-moz-color-swatch {
  border: 2px solid var(--line);
  border-radius: 6px;
}

.toolbar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.tool-btn:hover,
.tool-btn.active {
  border-color: var(--teal);
  color: var(--teal);
}

.eraser-icon {
  flex-shrink: 0;
  display: inline-block;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 2px;
}

.fill-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-dim);
  cursor: pointer;
}

.brush-size {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-dim);
}

button.small {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
}

button.small:hover,
button.small.active {
  border-color: var(--teal);
  color: var(--teal);
}

.painter-wrap {
  border: 1px solid var(--line);
  border-radius: 6px;
}

canvas {
  cursor: crosshair;
  touch-action: none;
  display: block;
  width: 100%;
  height: 100%;
}
</style>
