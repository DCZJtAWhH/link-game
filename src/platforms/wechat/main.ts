import { drawSetupScreen, SCREEN_HEIGHT, SCREEN_WIDTH } from '../../shared/setup-screen';

const canvas = wx.createCanvas();
const { windowWidth, windowHeight, pixelRatio } = wx.getWindowInfo();
canvas.width = Math.round(windowWidth * pixelRatio);
canvas.height = Math.round(windowHeight * pixelRatio);
const context = canvas.getContext('2d');
if (!context) throw new Error('微信运行环境不支持 Canvas 2D');

const scale = Math.min(windowWidth / SCREEN_WIDTH, windowHeight / SCREEN_HEIGHT);
context.fillStyle = '#e3e7df';
context.fillRect(0, 0, canvas.width, canvas.height);
context.translate(
  ((windowWidth - SCREEN_WIDTH * scale) / 2) * pixelRatio,
  ((windowHeight - SCREEN_HEIGHT * scale) / 2) * pixelRatio,
);
context.scale(scale * pixelRatio, scale * pixelRatio);
drawSetupScreen(context);
wx.onTouchStart(() => drawSetupScreen(context, true));
