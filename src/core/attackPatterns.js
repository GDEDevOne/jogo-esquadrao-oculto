/**
 * Padrões de ataque. A âncora (x,y) é sempre a célula clicada pelo jogador.
 * - unico: a própria célula
 * - linha3: a âncora é o CENTRO da linha de 3 células
 * - cruz: a âncora é o CENTRO da cruz (ela + 4 vizinhos ortogonais)
 * - area2x2: a âncora é o canto superior-esquerdo do bloco 2x2
 * - area3x3: a âncora é o CENTRO do bloco 3x3
 */
export function getRawAttackCells(type, x, y, orientation = 'H') {
  switch (type) {
    case 'linha3':
      return orientation === 'V'
        ? [[x, y - 1], [x, y], [x, y + 1]]
        : [[x - 1, y], [x, y], [x + 1, y]];
    case 'cruz':
      return [[x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    case 'area2x2':
      return [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
    case 'area3x3': {
      const cells = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          cells.push([x + dx, y + dy]);
        }
      }
      return cells;
    }
    case 'unico':
    default:
      return [[x, y]];
  }
}

export function clipToBoard(cells, size) {
  return cells.filter(([cx, cy]) => cx >= 0 && cy >= 0 && cx < size && cy < size);
}

export function getAttackCells(type, x, y, orientation = 'H', size = Infinity) {
  return clipToBoard(getRawAttackCells(type, x, y, orientation), size);
}
