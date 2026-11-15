import { connection, generate } from './board';
import type { Pair, Point } from './board';

export type Phase = 'home' | 'playing' | 'paused' | 'won' | 'lost';
export interface Feedback { kind: 'match' | 'mismatch'; pair: Pair; path: Point[]; remaining: number }
export interface GameState {
  phase: Phase;
  level: number;
  columns: number;
  rows: number;
  board: (number | null)[];
  solution: Pair[];
  selected: number | null;
  remaining: number;
  feedback: Feedback | null;
}
export interface GameOptions { random?: () => number }

/** Platform-independent public gameplay boundary. All durations are in seconds. */
export class Game {
  private readonly random: () => number;
  private current: GameState = { phase: 'home', level: 1, columns: 4, rows: 4, board: [], solution: [], selected: null, remaining: 300, feedback: null };

  constructor(options: GameOptions = {}) { this.random = options.random ?? Math.random; }

  get state(): GameState {
    return { ...this.current, board: [...this.current.board], solution: this.current.solution.map(pair => [...pair]), feedback: this.current.feedback ? { ...this.current.feedback, pair: [...this.current.feedback.pair], path: this.current.feedback.path.map(point => ({ ...point })) } : null };
  }

  start(): void {
    const layout = generate(4, 4, 4, this.random);
    this.current = { phase: 'playing', level: 1, columns: 4, rows: 4, ...layout, selected: null, remaining: 300, feedback: null };
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
    state.selected = null;
    // Settle at acceptance time. The final connection may outlive the timer.
    if (state.board.filter(fruit => fruit !== null).length === 2) state.phase = 'won';
  }

  advance(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    const state = this.current;
    if (state.phase === 'paused' || state.phase === 'home') return;
    if (state.feedback) {
      state.feedback.remaining -= seconds;
      if (state.feedback.remaining <= 0) {
        if (state.feedback.kind === 'match') state.feedback.pair.forEach(index => { state.board[index] = null; });
        state.feedback = null;
      }
    }
    if (state.phase === 'playing') {
      state.remaining = Math.max(0, state.remaining - seconds);
      if (state.remaining === 0) { state.phase = 'lost'; state.selected = null; }
    }
  }

  pause(): void { if (this.current.phase === 'playing') this.current.phase = 'paused'; }
  resume(): void { if (this.current.phase === 'paused') this.current.phase = 'playing'; }
  home(): void { this.current.phase = 'home'; this.current.selected = null; this.current.feedback = null; }
}
