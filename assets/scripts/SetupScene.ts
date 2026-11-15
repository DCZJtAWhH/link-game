import {
  _decorator, BlockInputEvents, Camera, Canvas, Color, Component, game, Game as EngineGame, Graphics, Label,
  Layers, Node, profiler, ResolutionPolicy, resources, Sprite, SpriteFrame, UITransform, view,
} from 'cc';
import { Game } from './core/Game';
import type { GameState, Tool } from './core/Game';
import type { Point } from './core/board';
import { localProgressStorage } from './platform/Storage';
import { GameAudio } from './platform/GameAudio';

const { ccclass } = _decorator;
const WIDTH = 360, HEIGHT = 640;
const INK = '#254F3E', PAPER = '#F8F5E9', GREEN = '#346D4D', MUTED = '#75846E';
const FRUITS = ['apple', 'banana', 'grapes', 'orange', 'strawberry', 'watermelon', 'pineapple', 'pear', 'peach', 'cherry'];
const RULES = [
  ['找到一样的水果', '点击两个相同的水果，试着把它们连起来。'],
  ['最多转弯两次', '连线只能横着或竖着走，不能穿过其他水果。'],
  ['试试从外面绕行', '棋盘外的一圈空白，也是可以走的路。'],
];

/** Cocos owns display, input and lifecycle; Game remains the single rules boundary. */
@ccclass('SetupScene')
export class SetupScene extends Component {
  private readonly session = new Game({ storage: localProgressStorage });
  private ui!: Node;
  private audio!: GameAudio;
  private readonly images = new Map<string, SpriteFrame>();
  private ready = false;
  private loadError = false;
  private settingsOpen = false;
  private renderKey = '';

  start(): void {
    profiler.hideStats();
    view.setDesignResolutionSize(WIDTH, HEIGHT, ResolutionPolicy.SHOW_ALL);
    const root = this.makeNode(this.node, 'Canvas', WIDTH, HEIGHT);
    const canvas = root.addComponent(Canvas);
    const cameraNode = this.makeNode(root, 'UICamera'); cameraNode.setPosition(0, 0, 1000);
    const camera = cameraNode.addComponent(Camera);
    camera.projection = Camera.ProjectionType.ORTHO; camera.orthoHeight = HEIGHT / 2;
    camera.near = 0; camera.far = 2000; camera.visibility = Layers.Enum.UI_2D;
    camera.clearFlags = Camera.ClearFlag.SOLID_COLOR; camera.clearColor = this.color('#DFE6D9');
    canvas.cameraComponent = camera;
    this.ui = this.makeNode(root, 'GameUI', WIDTH, HEIGHT);
    this.audio = new GameAudio(root);
    game.on(EngineGame.EVENT_HIDE, this.onHide, this);
    game.on(EngineGame.EVENT_SHOW, this.onShow, this);
    this.render();
    void this.loadAssets();
  }

  private async loadAssets(): Promise<void> {
    try {
      await Promise.all([
        ...[...FRUITS, 'tile', 'tile-selected', 'hint', 'shuffle', 'time'].map(name => new Promise<void>((resolve, reject) => {
          resources.load(`art/${name}/spriteFrame`, SpriteFrame, (error, frame) => {
            if (error) { reject(error); return; }
            this.images.set(name, frame); resolve();
          });
        })),
        this.audio.load(),
      ]);
      this.ready = true;
    } catch (error) { this.loadError = true; console.error('Local game resources failed to load', error); }
    this.render();
  }

  onDestroy(): void {
    game.off(EngineGame.EVENT_HIDE, this.onHide, this);
    game.off(EngineGame.EVENT_SHOW, this.onShow, this);
  }
  private onHide(): void { this.session.pause(); this.audio.setForeground(false); this.render(); }
  private onShow(): void { this.audio.setForeground(true); this.audio.sync(this.session.state); this.render(); }

  update(seconds: number): void {
    if (!this.ready) return;
    const before = this.session.state;
    this.session.advance(seconds);
    this.audio.transition(before, this.session.state);
    if (this.ui) this.render();
  }

  private act(action: () => unknown, click = true): void {
    const before = this.session.state;
    action();
    const after = this.session.state;
    if (click && after.phase !== 'paused' && after.phase !== 'tutorial') this.audio.play('click', after);
    this.audio.transition(before, after);
    this.render();
  }

  private render(): void {
    const state = this.session.state;
    const key = JSON.stringify({ ...state, remaining: Math.ceil(state.remaining), feedback: state.feedback ? { ...state.feedback, remaining: 0 } : null, ready: this.ready, error: this.loadError, settings: this.settingsOpen });
    if (key === this.renderKey) return;
    this.renderKey = key;
    for (const child of [...this.ui.children]) { child.removeFromParent(); child.destroy(); }
    this.panel(this.ui, 'Background', 0, 0, WIDTH, HEIGHT, PAPER, 0);
    if (!this.ready) {
      this.text(this.ui, this.loadError ? '资源准备失败' : '正在准备小果园…', 21, 0, 30);
      this.text(this.ui, this.loadError ? '请重新进入游戏' : '所有水果和声音都在本地', 13, 0, -10, MUTED);
      return;
    }
    if (state.phase === 'home') this.drawHome(state);
    else this.drawGame(state);
    if (this.settingsOpen) this.drawSettings(state);
  }

  private drawHome(state: GameState): void {
    this.text(this.ui, '水果连连看', 17, 0, 270, GREEN);
    this.panel(this.ui, 'HomeAccent', 0, 237, 32, 3, '#B4C48F', 1);
    this.text(this.ui, '连一连，放松一下。', 28, 0, 186);
    this.text(this.ui, '两次转弯，找到同一种水果', 13, 0, 147, MUTED);
    const fruits = ['apple', 'banana', 'grapes', 'orange', 'strawberry'];
    fruits.forEach((name, index) => {
      const x = (index - 2) * 55;
      const y = index % 2 === 0 ? 67 : 48;
      this.image(this.ui, name, x, y, 61, 61);
    });
    this.panel(this.ui, 'Progress', 0, -32, 292, 78, '#EBEEDC', 18);
    this.text(this.ui, state.progress.completed ? '本期挑战完成 · 40 / 40' : `当前第 ${String(state.progress.currentLevel).padStart(2, '0')} 关 / 40`, 19, 0, -21);
    this.text(this.ui, state.progress.completed ? '成果已保存，可以再来一局' : '每局 5 分钟，慢慢找，稳稳连', 12, 0, -49, MUTED);
    this.button(this.ui, state.progress.completed ? '重玩第 40 关' : '开始挑战', 0, -113, () => this.session.start(), { width: 292, height: 54 });
    this.button(this.ui, '声音设置', 0, -183, () => { this.settingsOpen = true; }, { primary: false, width: 132, height: 38 });
    this.text(this.ui, '不赶路，也能一关一关向前。', 12, 0, -274, MUTED);
  }

  private drawGame(state: GameState): void {
    this.text(this.ui, `第 ${String(state.level).padStart(2, '0')} 关`, 20, -111, 280);
    this.text(this.ui, '/ 40', 12, -54, 277, MUTED);
    this.button(this.ui, '暂停', 128, 280, () => this.session.pause(), { primary: false, width: 64, height: 34 });
    const rounded = Math.ceil(state.remaining);
    const time = `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
    this.text(this.ui, time, 32, 0, 235, rounded <= 30 ? '#B3583C' : INK);
    this.text(this.ui, rounded <= 30 ? '时间不多了，专心找下一对' : '相同水果 · 最多两次转弯', 12, 0, 206, rounded <= 30 ? '#B3583C' : MUTED);
    this.panel(this.ui, 'BoardField', 0, -5, 332, 408, '#EBEEDC', 22);
    if (state.phase === 'paused') { this.drawPause(state); return; }
    if (state.phase === 'tutorial') { this.drawTutorial(state); return; }
    this.drawBoard(state);
    if (state.phase === 'won' || state.phase === 'lost') {
      if (!(state.phase === 'won' && state.feedback?.kind === 'match')) this.drawResult(state);
      return;
    }
    this.toolButton(state, 'hint', '提示', -108);
    this.toolButton(state, 'shuffle', '重排', 0);
    this.toolButton(state, 'time', '+20秒', 108);
    this.text(this.ui, '点一下选中，再点一下取消', 11, 0, -294, MUTED);
    if (state.phase === 'reshuffling') {
      this.panel(this.ui, 'ReshuffleNotice', 0, -5, 304, 70, PAPER);
      this.text(this.ui, state.reshuffleReason === 'system' ? '系统免费重排' : '换个顺序，继续找', 19, 0, 6);
      this.text(this.ui, '时间已暂停，空位和水果都保留', 12, 0, -20, MUTED);
    }
  }

  private drawBoard(state: GameState): void {
    const cell = Math.min(58, 264 / state.columns, 336 / state.rows);
    const top = (state.rows - 1) * cell / 2 - 5;
    const position = (point: Point): Point => ({ x: (point.x - (state.columns - 1) / 2) * cell, y: top - point.y * cell });
    state.board.forEach((fruit, index) => {
      if (fruit === null) return;
      const point = position({ x: index % state.columns, y: Math.floor(index / state.columns) });
      const selected = state.selected === index;
      const hinted = state.hint?.includes(index);
      const mismatch = state.feedback?.kind === 'mismatch' && state.feedback.pair.includes(index);
      const tile = this.makeNode(this.ui, `Tile-${index}`, cell - 3, cell - 3); tile.setPosition(point.x, point.y);
      if (hinted || mismatch) this.panel(tile, 'Feedback', 0, 0, cell, cell, mismatch ? '#E69782' : '#E7C157', 10);
      this.image(tile, selected ? 'tile-selected' : 'tile', 0, 0, cell - 3, cell - 3);
      this.image(tile, FRUITS[fruit]!, 0, 1, cell - 9, cell - 9);
      tile.on(Node.EventType.TOUCH_END, () => this.act(() => this.session.select(index), false), this);
    });
    if (state.feedback?.kind === 'match') {
      const line = this.makeNode(this.ui, 'Connection'); const graphics = line.addComponent(Graphics);
      graphics.strokeColor = this.color('#83A443'); graphics.lineWidth = 4;
      state.feedback.path.forEach((point, index) => {
        const pixel = position(point);
        if (index === 0) graphics.moveTo(pixel.x, pixel.y); else graphics.lineTo(pixel.x, pixel.y);
      });
      graphics.stroke();
      for (const index of state.feedback.pair) {
        const pixel = position({ x: index % state.columns, y: Math.floor(index / state.columns) });
        graphics.fillColor = this.color('#FCF4B8'); graphics.circle(pixel.x, pixel.y, 4); graphics.fill();
      }
    }
  }

  private toolButton(state: GameState, tool: Tool, title: string, x: number): void {
    const enabled = state.phase === 'playing' && state.tools[tool] > 0 && state.feedback?.kind !== 'match';
    const node = this.panel(this.ui, `Tool-${tool}`, x, -250, 100, 62, enabled ? '#FFFFFF' : '#ECECDF', 15);
    this.image(node, tool, -25, 4, 27, 27);
    this.text(node, title, 14, 15, 10, enabled ? INK : MUTED, 64);
    this.text(node, `余 ${state.tools[tool]} 次`, 10, 15, -10, MUTED, 64);
    node.on(Node.EventType.TOUCH_END, () => this.act(() => this.session.useTool(tool)), this);
  }

  private drawPause(state: GameState): void {
    this.text(this.ui, '休息一下', 27, 0, 113);
    this.text(this.ui, '棋盘已遮住，时间也停下了', 13, 0, 75, MUTED);
    this.button(this.ui, '继续挑战', 0, 10, () => this.session.resume(), { width: 252 });
    this.button(this.ui, '玩法说明', 0, -51, () => this.session.showRules(), { primary: false, width: 252 });
    this.toggle(state, 'music', '音乐', -83, -113);
    this.toggle(state, 'effects', '音效', 83, -113);
    this.button(this.ui, '返回首页', 0, -174, () => this.session.home(), { primary: false, width: 252, height: 38 });
    this.text(this.ui, '本局配额和剩余时间都为你保留', 11, 0, -264, MUTED);
  }

  private drawTutorial(state: GameState): void {
    const step = state.tutorialStep;
    const rule = RULES[step]!;
    this.text(this.ui, `玩法说明  ${step + 1} / 3`, 12, 0, 156, MUTED);
    this.text(this.ui, rule[0]!, 24, 0, 116);
    this.ruleDiagram(step);
    this.text(this.ui, rule[1]!, 12, 0, -43, MUTED, 290);
    this.button(this.ui, step === 2 ? '知道了' : '下一步', 0, -103, () => this.session.nextTutorial(), { width: 252 });
    this.button(this.ui, '跳过 / 关闭', 0, -163, () => this.session.skipTutorial(), { primary: false, width: 252, height: 38 });
    this.text(this.ui, '阅读期间不计时', 11, 0, -266, MUTED);
  }

  private ruleDiagram(step: number): void {
    const box = this.panel(this.ui, 'RuleDiagram', 0, 30, 260, 105, PAPER, 16);
    const graphics = this.makeNode(box, 'RulePath').addComponent(Graphics);
    const path = step === 0 ? [[-80, 0], [80, 0]] : step === 1
      ? [[-80, 25], [-30, 25], [-30, -25], [80, -25]]
      : [[-80, 0], [-80, 40], [80, 40], [80, 0]];
    graphics.strokeColor = this.color('#83A443'); graphics.lineWidth = 4;
    path.forEach((point, index) => { if (index === 0) graphics.moveTo(point[0]!, point[1]!); else graphics.lineTo(point[0]!, point[1]!); }); graphics.stroke();
    if (step === 2) {
      this.panel(box, 'OccupiedRegion', 0, -9, 200, 49, '#DAE2CA', 8);
      this.image(box, 'orange', -25, -10, 32, 32); this.image(box, 'grapes', 25, -10, 32, 32);
    }
    this.image(box, 'tile', -80, step === 1 ? 25 : 0, 40, 40);
    this.image(box, 'tile', 80, step === 1 ? -25 : 0, 40, 40);
    this.image(box, 'apple', -80, step === 1 ? 25 : 0, 34, 34);
    this.image(box, 'apple', 80, step === 1 ? -25 : 0, 34, 34);
  }

  private drawResult(state: GameState): void {
    const won = state.phase === 'won';
    this.panel(this.ui, 'ResultPanel', 0, -4, 304, 290, PAPER, 20);
    this.image(this.ui, won ? 'strawberry' : 'pear', 0, 94, 62, 62);
    this.text(this.ui, won ? state.level === 40 ? '本期挑战完成！' : '这一关，连好了！' : '时间到了', 24, 0, 34);
    this.text(this.ui, won ? state.level === 40 ? '40 关的成果已保存，随时再来一局' : `下一站，第 ${state.progress.currentLevel} 关` : '再试一次，会发现新的路线', 12, 0, -4, MUTED);
    this.button(this.ui, won ? state.level === 40 ? '重玩第 40 关' : '下一关' : '重新挑战', 0, -64, () => this.session.start(), { width: 252 });
    this.button(this.ui, '返回首页', 0, -123, () => this.session.home(), { primary: false, width: 252, height: 38 });
  }

  private drawSettings(state: GameState): void {
    const cover = this.panel(this.ui, 'SettingsCover', 0, 0, WIDTH, HEIGHT, PAPER, 0);
    cover.addComponent(BlockInputEvents);
    this.text(cover, '声音设置', 27, 0, 172);
    this.text(cover, '为自己留一点安静，或一点旋律', 12, 0, 130, MUTED);
    this.toggle(state, 'music', '音乐', 0, 47, cover);
    this.toggle(state, 'effects', '音效', 0, -17, cover);
    this.button(cover, '返回', 0, -128, () => { this.settingsOpen = false; }, { width: 252 });
    this.text(cover, '设置会保存在这台设备', 12, 0, -229, MUTED);
  }

  private toggle(state: GameState, key: 'music' | 'effects', title: string, x: number, y: number, parent = this.ui): void {
    this.button(parent, `${title}  ${state.progress[key] ? '开' : '关'}`, x, y, () => this.session.updatePreferences({ [key]: !this.session.state.progress[key] }), { primary: false, width: 146, height: 40 });
  }

  private makeNode(parent: Node, name: string, width = 0, height = 0): Node {
    const node = new Node(name); node.layer = Layers.Enum.UI_2D; parent.addChild(node);
    node.addComponent(UITransform).setContentSize(width, height); return node;
  }
  private color(hex: string): Color { return new Color().fromHEX(hex); }
  private image(parent: Node, name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.makeNode(parent, name, width, height); node.setPosition(x, y);
    const sprite = node.addComponent(Sprite); sprite.spriteFrame = this.images.get(name)!;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    node.getComponent(UITransform)!.setContentSize(width, height);
    return node;
  }
  private panel(parent: Node, name: string, x: number, y: number, width: number, height: number, fill: string, radius = 16): Node {
    const node = this.makeNode(parent, name, width, height); node.setPosition(x, y);
    const graphics = node.addComponent(Graphics); graphics.fillColor = this.color(fill);
    graphics.roundRect(-width / 2, -height / 2, width, height, radius); graphics.fill(); return node;
  }
  private text(parent: Node, value: string, size: number, x: number, y: number, color = INK, width = WIDTH - 24): Label {
    const node = this.makeNode(parent, value, width, 38); node.setPosition(x, y);
    const label = node.addComponent(Label); label.string = value; label.fontSize = size; label.lineHeight = 38;
    label.color = this.color(color); label.horizontalAlign = Label.HorizontalAlign.CENTER;
    return label;
  }
  private button(parent: Node, value: string, x: number, y: number, action: () => unknown, options: { primary?: boolean; width?: number; height?: number } = {}): void {
    const { primary = true, width = 210, height = 48 } = options;
    const node = this.panel(parent, value, x, y, width, height, primary ? GREEN : '#E3E8D4', 13);
    this.text(node, value, height <= 40 ? 14 : 17, 0, 0, primary ? '#FFFFFF' : INK, width - 8);
    node.on(Node.EventType.TOUCH_END, () => this.act(action), this);
  }
}
