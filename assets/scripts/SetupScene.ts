import {
  _decorator, Camera, Canvas, Color, Component, game, Game as EngineGame, Graphics, Label,
  Layers, Node, profiler, ResolutionPolicy, UITransform, view,
} from 'cc';
import { Game } from './core/Game';
import type { GameState } from './core/Game';
import type { Point } from './core/board';

const { ccclass } = _decorator;
const WIDTH = 360, HEIGHT = 640;
const INK = '#294B3B', PAPER = '#FAF7EF', GREEN = '#326B4F';
const FRUITS = ['苹果', '香蕉', '葡萄', '橙子'];
const FRUIT_COLORS = ['#D94E48', '#D8AE26', '#8663A8', '#E38A35'];

/** Cocos owns display, input and lifecycle; the gameplay module owns every rule. */
@ccclass('SetupScene')
export class SetupScene extends Component {
  private readonly session = new Game();
  private ui!: Node;
  private renderKey = '';

  start(): void {
    profiler.hideStats();
    view.setDesignResolutionSize(WIDTH, HEIGHT, ResolutionPolicy.SHOW_ALL);
    const root = this.makeNode(this.node, 'Canvas', WIDTH, HEIGHT);
    const canvas = root.addComponent(Canvas);
    const cameraNode = this.makeNode(root, 'UICamera');
    cameraNode.setPosition(0, 0, 1000);
    const camera = cameraNode.addComponent(Camera);
    camera.projection = Camera.ProjectionType.ORTHO;
    camera.orthoHeight = HEIGHT / 2;
    camera.near = 0; camera.far = 2000;
    camera.visibility = Layers.Enum.UI_2D;
    camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
    camera.clearColor = new Color(227, 231, 223, 255);
    canvas.cameraComponent = camera;
    this.ui = this.makeNode(root, 'GameUI', WIDTH, HEIGHT);
    game.on(EngineGame.EVENT_HIDE, this.onHide, this);
    this.render();
  }

  onDestroy(): void { game.off(EngineGame.EVENT_HIDE, this.onHide, this); }
  private onHide(): void { this.session.pause(); this.render(); }

  update(seconds: number): void {
    this.session.advance(seconds);
    if (this.ui) this.render();
  }

  private act(action: () => void): void { action(); this.render(); }

  private render(): void {
    const state = this.session.state;
    const key = JSON.stringify({ ...state, remaining: Math.ceil(state.remaining), feedback: state.feedback ? { ...state.feedback, remaining: 0 } : null });
    if (key === this.renderKey) return;
    this.renderKey = key;
    for (const child of [...this.ui.children]) { child.removeFromParent(); child.destroy(); }
    this.panel(this.ui, 'Background', 0, 0, WIDTH, HEIGHT, PAPER, 0);
    if (state.phase === 'home') {
      this.label(this.ui, '水果连连看', 30, 172);
      this.label(this.ui, '两次转弯，找到同一种水果', 14, 126);
      this.label(this.ui, '第 1 关 · 4 × 4 · 5 分钟', 16, 34);
      this.button(this.ui, '开始挑战', 0, -30, () => this.session.start());
      this.label(this.ui, '配对消除 · 路径可经过外围', 13, -244);
      return;
    }
    this.label(this.ui, `第 ${state.level} 关`, 20, 268);
    const minutes = Math.floor(Math.ceil(state.remaining) / 60);
    const seconds = Math.ceil(state.remaining) % 60;
    this.label(this.ui, `${minutes}:${String(seconds).padStart(2, '0')}`, 30, 220, state.remaining <= 30 ? '#B95738' : INK);
    this.label(this.ui, state.remaining <= 30 ? '时间不多了，慢慢看，稳稳连' : '相同水果 · 最多两次转弯', 13, 181);
    if (state.phase === 'paused') {
      this.panel(this.ui, 'CoveredBoard', 0, 10, 322, 300, '#E7EADC');
      this.label(this.ui, '已暂停', 26, 50);
      this.label(this.ui, '棋盘已遮住，时间已停止', 14, 10);
      this.button(this.ui, '继续挑战', 0, -66, () => this.session.resume());
      this.button(this.ui, '返回首页', 0, -132, () => this.session.home(), false);
      return;
    }
    this.drawBoard(state);
    if (state.phase === 'playing') {
      this.button(this.ui, '暂停', 0, -240, () => this.session.pause(), false);
      this.label(this.ui, '点击图块选中 · 再点一次取消', 12, -288);
    } else {
      const won = state.phase === 'won';
      this.panel(this.ui, 'ResultPanel', 0, -174, 322, 228, PAPER);
      this.label(this.ui, won ? '通关啦！' : '时间到了', 25, -103);
      this.button(this.ui, won ? '再玩一局' : '重新挑战', 0, -163, () => this.session.start());
      this.button(this.ui, '返回首页', 0, -226, () => this.session.home(), false);
    }
  }

  private drawBoard(state: GameState): void {
    const cell = Math.min(58, 276 / state.columns);
    const top = (state.rows - 1) * cell / 2 + 30;
    const position = (point: Point): Point => ({ x: (point.x - (state.columns - 1) / 2) * cell, y: top - point.y * cell });
    state.board.forEach((fruit, index) => {
      if (fruit === null) return;
      const point = position({ x: index % state.columns, y: Math.floor(index / state.columns) });
      const selected = state.selected === index;
      const mismatch = state.feedback?.kind === 'mismatch' && state.feedback.pair.includes(index);
      const tile = this.panel(this.ui, `Tile-${index}`, point.x, point.y, cell - 6, cell - 6, mismatch ? '#F4CFC2' : selected ? '#CDE3BA' : '#ECE8D9', 10);
      const dot = tile.getComponent(Graphics)!;
      dot.fillColor = this.color(FRUIT_COLORS[fruit] ?? GREEN);
      dot.circle(0, 5, cell * 0.19); dot.fill();
      this.label(tile, FRUITS[fruit] ?? String(fruit), 11, -13);
      tile.on(Node.EventType.TOUCH_END, () => this.act(() => this.session.select(index)), this);
    });
    if (state.feedback?.kind === 'match') {
      const line = this.makeNode(this.ui, 'Connection');
      const graphics = line.addComponent(Graphics);
      graphics.strokeColor = this.color('#688D37'); graphics.lineWidth = 4;
      state.feedback.path.forEach((point, index) => {
        const pixel = position(point);
        if (index === 0) graphics.moveTo(pixel.x, pixel.y); else graphics.lineTo(pixel.x, pixel.y);
      });
      graphics.stroke();
    }
  }

  private makeNode(parent: Node, name: string, width = 0, height = 0): Node {
    const node = new Node(name); node.layer = Layers.Enum.UI_2D;
    parent.addChild(node);
    node.addComponent(UITransform).setContentSize(width, height);
    return node;
  }

  private color(hex: string): Color { return new Color().fromHEX(hex); }

  private panel(parent: Node, name: string, x: number, y: number, width: number, height: number, fill: string, radius = 16): Node {
    const node = this.makeNode(parent, name, width, height); node.setPosition(x, y);
    const graphics = node.addComponent(Graphics); graphics.fillColor = this.color(fill);
    graphics.roundRect(-width / 2, -height / 2, width, height, radius); graphics.fill();
    return node;
  }

  private label(parent: Node, text: string, size: number, y: number, color = INK): Label {
    const node = this.makeNode(parent, text, WIDTH - 32, 40); node.setPosition(0, y);
    const label = node.addComponent(Label);
    label.string = text; label.fontSize = size; label.lineHeight = 40;
    label.color = this.color(color); label.horizontalAlign = Label.HorizontalAlign.CENTER;
    return label;
  }

  private button(parent: Node, text: string, x: number, y: number, action: () => void, primary = true): void {
    const node = this.panel(parent, text, x, y, 210, 48, primary ? GREEN : '#E5E8DC');
    this.label(node, text, 17, 0, primary ? '#FFFFFF' : INK);
    node.on(Node.EventType.TOUCH_END, () => this.act(action), this);
  }
}
