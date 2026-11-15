import {
  _decorator, Camera, Canvas, Color, Component, Graphics, Label,
  Layers, Node, profiler, ResolutionPolicy, UITransform, view,
} from 'cc';

const { ccclass } = _decorator;
const WIDTH = 360;
const HEIGHT = 640;

@ccclass('SetupScene')
export class SetupScene extends Component {
  start(): void {
    profiler.hideStats();
    view.setDesignResolutionSize(WIDTH, HEIGHT, ResolutionPolicy.SHOW_ALL);

    const root = new Node('Canvas');
    root.layer = Layers.Enum.UI_2D;
    this.node.addChild(root);
    root.addComponent(UITransform).setContentSize(WIDTH, HEIGHT);
    const canvas = root.addComponent(Canvas);

    const cameraNode = new Node('UICamera');
    root.addChild(cameraNode);
    cameraNode.setPosition(0, 0, 1000);
    const camera = cameraNode.addComponent(Camera);
    camera.projection = Camera.ProjectionType.ORTHO;
    camera.orthoHeight = HEIGHT / 2;
    camera.near = 0;
    camera.far = 2000;
    camera.visibility = Layers.Enum.UI_2D;
    camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
    camera.clearColor = new Color(227, 231, 223, 255);
    canvas.cameraComponent = camera;

    const panel = new Node('SetupPanel');
    panel.layer = Layers.Enum.UI_2D;
    root.addChild(panel);
    panel.addComponent(UITransform).setContentSize(WIDTH, HEIGHT);
    const background = panel.addComponent(Graphics);
    background.fillColor = new Color(246, 243, 235, 255);
    background.rect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
    background.fill();

    this.addLabel(panel, 'Title', '水果连连看', 28, 72);
    this.addLabel(panel, 'Status', '本地环境已就绪', 16, 24);
    const input = this.addLabel(panel, 'InputStatus', '点击画面检查输入', 14, -32);
    panel.on(Node.EventType.TOUCH_END, () => { input.string = '输入正常'; }, this);
  }

  private addLabel(parent: Node, name: string, text: string, size: number, y: number): Label {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    parent.addChild(node);
    node.setPosition(0, y, 0);
    node.addComponent(UITransform).setContentSize(WIDTH - 32, 40);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = size;
    label.lineHeight = 40;
    label.color = new Color(37, 61, 49, 255);
    return label;
  }
}
