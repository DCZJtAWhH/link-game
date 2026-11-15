export interface Progress {
  currentLevel: number;
  completed: boolean;
  tutorialSeen: boolean;
  music: boolean;
  effects: boolean;
}
export interface ProgressStorage { load(): unknown; save(progress: Progress): void }

export function readProgress(value: unknown): Progress {
  const data = value && typeof value === 'object' ? value as Partial<Progress> : {};
  const level = Number.isInteger(data.currentLevel) ? Math.max(1, Math.min(40, data.currentLevel!)) : 1;
  return {
    currentLevel: data.completed === true ? 40 : level,
    completed: data.completed === true,
    tutorialSeen: data.tutorialSeen === true,
    music: data.music !== false,
    effects: data.effects !== false,
  };
}
