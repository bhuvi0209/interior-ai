export function snapToGrid(
  value: number,
  gridSize: number
) {
  return Math.round(value / gridSize) * gridSize;
}