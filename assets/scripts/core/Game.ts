import { connection, generate, rearrange } from './board';
import type { Pair, Point } from './board';
import { LEVELS } from './levels';
import { readProgress } from './progress';
import type { Progress, ProgressStorage } from './progress';

export type Phase = 'home' | 'tutorial' | 'playing' | 'paused' | 'reshuffling' | 'won' | 'lost';
export type Tool = 'hint' | 'shuffle' | 'time';
export interface Feedback { kind: 'match' | 'mismatch'; pair: Pair; path: Point[]; remaining: number }
export interface GameState {
  progress: Progress;
  phase: Phase;
  level: number;
  tutorialStep: number;
  columns: number;
  rows: number;
  board: (number | null)[];
  solution: Pair[];
  selected: number | null;
  remaining: number;
  feedback: Feedback | null;
  tools: Record<Tool, number>;
  hint: Pair | null;
  reshuffleReason: 'manual' | 'system' | null;
}
export interface GameOptions { random?: () => number; storage?: ProgressStorage }

/** Platform-independent public gameplay boundary. All durations are in seconds. */
export class Game {
  private readonly random: () => number;
  private readonly storage?: ProgressStorage;
  private progress: Progress;
  private shuffleRemaining = 0;
  private tutorialReturn: 'playing' | 'paused' = 'playing';
  private pausedPhase: 'playing' | 'reshuffling' = 'playing';
  private current: Omit<GameState, 'progress'> = { phase: 'home', level: 1, tutorialStep: 0, columns: 4, rows: 4, board: [], solution: [], selected: null, remaining: 300, feedback: null, tools: { hint: 2, shuffle: 1, time: 1 }, hint: null, reshuffleReason: null };

  constructor(options: GameOptions = {}) {
    this.random = options.random ?? Math.random;
    this.storage = options.storage;
    let saved: unknown;
    try { saved = this.storage?.load(); } catch { /* An unavailable platform store starts fresh. */ }
    this.progress = readProgress(saved);
    this.current.level = this.progress.currentLevel;
  }

  get state(): GameState {
    return { ...this.current, progress: { ...this.progress }, tools: { ...this.current.tools }, hint: this.current.hint ? [...this.current.hint] : null, board: [...this.current.board], solution: this.current.solution.map(pair => [...pair]), feedback: this.current.feedback ? { ...this.current.feedback, pair: [...this.current.feedback.pair], path: this.current.feedback.path.map(point => ({ ...point })) } : null };
  }

  start(): void {
    const config = LEVELS[this.progress.currentLevel - 1]!;
    const layout = generate(config.columns, config.rows, config.types, this.random);
    this.shuffleRemaining = 0;
    this.tutorialReturn = 'playing';
    this.current = { phase: config.number === 1 && !this.progress.tutorialSeen ? 'tutorial' : 'playing', tutorialStep: 0, level: config.number, columns: config.columns, rows: config.rows, ...layout, selected: null, remaining: config.seconds, feedback: null, tools: { hint: 2, shuffle: 1, time: 1 }, hint: null, reshuffleReason: null };
  }

  select(index: number): void {
    const state = this.current;
    if (state.phase !== 'playing' || !Number.isInteger(index) || state.board[index] == null || state.feedback?.kind === 'match') return;
    if (state.selected === index) { state.selected = null; return; }
    if (state.selected === null) { state.selected = index; return; }
    const first = state.selected;
    const path = state.board[first] === state.board[index] ? connection(state.board, state.columns, state.rows, first, index) : null;
    if (!path) {
      state.feedback = { kind: 'mismatch', pair: [first, index], path: [], remaining: 0.18 };
      state.selected = index;
      return;
    }
    state.feedback = { kind: 'match', pair: [first, index], path, remaining: 0.16 };
    if (state.hint?.some(cell => cell === first || cell === index)) state.hint = null;
    state.selected = null;
    // Settle at acceptance time. The final connection may outlive the timer.
    if (state.board.filter(fruit => fruit !== null).length === 2) {
      state.phase = 'won';
      this.progress.currentLevel = Math.min(40, state.level + 1);
      this.progress.completed ||= state.level === 40;
      this.saveProgress();
    }
  }

  advance(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    const state = this.current;
    if (state.phase === 'paused' || state.phase === 'home' || state.phase === 'tutorial') return;
    if (state.phase === 'reshuffling') {
      const elapsed = Math.min(seconds, this.shuffleRemaining);
      this.shuffleRemaining -= elapsed;
      if (this.shuffleRemaining <= 0) {
        state.phase = 'playing'; state.reshuffleReason = null;
        this.advance(seconds - elapsed);
      }
      return;
    }
    // Split at feedback completion so time after a free-reshuffle trigger is paused.
    if (state.phase === 'playing' && state.feedback && seconds > state.feedback.remaining) {
      const elapsed = state.feedback.remaining;
      this.advance(elapsed); this.advance(seconds - elapsed);
      return;
    }
    if (state.phase === 'playing') {
      state.remaining = Math.max(0, state.remaining - seconds);
      if (state.remaining === 0) { state.phase = 'lost'; state.selected = null; state.hint = null; }
    }
    if (state.feedback) {
      state.feedback.remaining -= seconds;
      if (state.feedback.remaining <= 0) {
        const matched = state.feedback.kind === 'match';
        if (matched) state.feedback.pair.forEach(index => { state.board[index] = null; });
        state.feedback = null;
        if (matched && state.phase === 'playing' && !this.findPair()) this.shuffle('system');
      }
    }
  }

  pause(): void {
    if (this.current.phase === 'playing' || this.current.phase === 'reshuffling') {
      this.pausedPhase = this.current.phase;
      this.current.phase = 'paused';
    }
  }
  resume(): void { if (this.current.phase === 'paused') this.current.phase = this.pausedPhase; }
  home(): void { this.current.phase = 'home'; this.current.selected = null; this.current.feedback = null; }

  nextTutorial(): void {
    if (this.current.phase !== 'tutorial') return;
    if (this.current.tutorialStep < 2) this.current.tutorialStep++;
    else this.skipTutorial();
  }

  skipTutorial(): void {
    if (this.current.phase !== 'tutorial') return;
    this.current.phase = this.tutorialReturn;
    this.progress.tutorialSeen = true;
    this.saveProgress();
  }

  showRules(): void {
    if (this.current.phase !== 'paused') return;
    this.tutorialReturn = 'paused';
    this.current.tutorialStep = 0;
    this.current.phase = 'tutorial';
  }

  updatePreferences(preferences: Partial<Pick<Progress, 'tutorialSeen' | 'music' | 'effects'>>): void {
    for (const key of ['tutorialSeen', 'music', 'effects'] as const) {
      if (typeof preferences[key] === 'boolean') this.progress[key] = preferences[key]!;
    }
    this.saveProgress();
  }

  useTool(tool: Tool): boolean {
    const state = this.current;
    if (state.phase !== 'playing' || state.tools[tool] <= 0 || state.feedback?.kind === 'match') return false;
    if (tool === 'time') {
      state.remaining += 20;
    } else if (tool === 'hint') {
      if (state.hint) return false;
      const pair = this.findPair();
      if (!pair) return false;
      state.hint = pair;
    } else if (!this.shuffle('manual')) return false;
    state.tools[tool]--;
    return true;
  }

  private findPair(): Pair | null {
    const state = this.current;
    for (let first = 0; first < state.board.length; first++) {
      if (state.board[first] === null) continue;
      for (let second = first + 1; second < state.board.length; second++) {
        if (state.board[first] === state.board[second] && connection(state.board, state.columns, state.rows, first, second)) return [first, second];
      }
    }
    return null;
  }

  private shuffle(reason: 'manual' | 'system'): boolean {
    const state = this.current;
    try {
      const layout = rearrange(state.board, state.columns, state.rows, this.random);
      state.board = layout.board; state.solution = layout.solution;
    } catch { return false; }
    state.phase = 'reshuffling'; state.reshuffleReason = reason;
    state.selected = null; state.hint = null; state.feedback = null;
    this.shuffleRemaining = 0.4;
    return true;
  }

  private saveProgress(): void {
    try { this.storage?.save({ ...this.progress }); } catch { /* Keep session playable if local storage is unavailable. */ }
  }
}
