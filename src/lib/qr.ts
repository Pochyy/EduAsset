export function qrPath(id: string) {
  let hash = 2166136261
  for (const character of id) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619) >>> 0
  }

  const size = 25
  const cells: Array<[number, number]> = []
  const finder = (x: number, y: number) => {
    for (let i = 0; i < 7; i += 1) {
      for (let j = 0; j < 7; j += 1) {
        const edge = i === 0 || j === 0 || i === 6 || j === 6
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4
        if (edge || core) cells.push([x + i, y + j])
      }
    }
  }

  finder(0, 0)
  finder(size - 7, 0)
  finder(0, size - 7)

  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      const inFinder =
        (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9)
      if (inFinder) continue
      hash ^= x * 31 + y * 17
      hash = Math.imul(hash, 16777619) >>> 0
      if (hash % 5 < 2) cells.push([x, y])
    }
  }

  return cells.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('')
}
