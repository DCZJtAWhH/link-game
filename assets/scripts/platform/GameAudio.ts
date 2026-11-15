import { AudioClip, AudioSource, Node, resources } from 'cc';
import type { GameState } from '../core/Game';

type Effect = 'click' | 'match' | 'mismatch' | 'win' | 'fail';

/** Local Cocos audio assets, with stoppable effects for pause/background changes. */
export class GameAudio {
  private readonly music: AudioSource;
  private readonly effect: AudioSource;
  private readonly clips = new Map<string, AudioClip>();
  private foreground = true;

  constructor(parent: Node) {
    const music = new Node('Music'); parent.addChild(music);
    const effects = new Node('Effects'); parent.addChild(effects);
    this.music = music.addComponent(AudioSource);
    this.music.loop = true; this.music.volume = 0.24;
    this.effect = effects.addComponent(AudioSource);
    this.effect.volume = 0.45;
  }

  async load(): Promise<void> {
    await Promise.all(['music', 'click', 'match', 'mismatch', 'win', 'fail'].map(name => new Promise<void>((resolve, reject) => {
      resources.load(`audio/${name}`, AudioClip, (error, clip) => {
        if (error) { reject(error); return; }
        this.clips.set(name, clip); resolve();
      });
    })));
    this.music.clip = this.clips.get('music')!;
  }

  setForeground(value: boolean): void {
    this.foreground = value;
    if (!value) { this.music.pause(); this.effect.stop(); }
  }

  sync(state: GameState): void {
    const audible = this.foreground && state.phase === 'playing';
    if (audible && state.progress.music && !this.music.playing) this.music.play();
    if ((!audible || !state.progress.music) && this.music.playing) this.music.pause();
    if (!this.foreground || !state.progress.effects || state.phase === 'paused' || state.phase === 'tutorial') this.effect.stop();
  }

  play(name: Effect, state: GameState): void {
    const clip = this.clips.get(name);
    if (!clip || !this.foreground || !state.progress.effects) return;
    this.effect.stop(); this.effect.clip = clip; this.effect.play();
  }

  transition(before: GameState, after: GameState): void {
    this.sync(after);
    if (after.phase === 'won' && before.phase !== 'won') this.play('win', after);
    else if (after.phase === 'lost' && before.phase !== 'lost') this.play('fail', after);
    else if (after.feedback && after.feedback !== before.feedback && (
      !before.feedback || after.feedback.pair.some((value, i) => value !== before.feedback!.pair[i]) || after.feedback.kind !== before.feedback.kind
    )) this.play(after.feedback.kind, after);
  }
}
