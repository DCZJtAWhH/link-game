import { drawSetupScreen, SCREEN_HEIGHT, SCREEN_WIDTH } from '../../shared/setup-screen';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('未找到游戏画布');
const context = canvas.getContext('2d');
if (!context) throw new Error('浏览器不支持 Canvas 2D');

let inputReceived = false;

const render = (): void => {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(SCREEN_WIDTH * ratio);
  canvas.height = Math.round(SCREEN_HEIGHT * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawSetupScreen(context, inputReceived);
};

canvas.addEventListener('pointerdown', () => {
  inputReceived = true;
  render();
});
window.addEventListener('resize', render);
render();
