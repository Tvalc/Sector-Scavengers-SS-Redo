// Bounds registry for tutorial highlights.
// Renderers write bounds during their draw pass; the tutorial overlay reads them.
// Since the game loop is synchronous, bounds are always current after rendering.

type Bounds = { x: number; y: number; w: number; h: number };

const registry = new Map<string, Bounds>();

export function setBounds(id: string, bounds: Bounds): void {
  registry.set(id, bounds);
}

export function getBounds(id: string): Bounds | null {
  return registry.get(id) ?? null;
}

export function clearBounds(): void {
  registry.clear();
}
