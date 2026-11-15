// Keep the shared drawing code independent of browser and WeChat globals.
interface DrawingContext {
  fillStyle: string | object;
  font: string;
  textAlign: 'center' | 'left' | 'right' | 'start' | 'end';
  textBaseline: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom';
  fillRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
}

export const SCREEN_WIDTH = 360;
export const SCREEN_HEIGHT = 640;

export function drawSetupScreen(context: DrawingContext, inputReceived = false): void {
  context.fillStyle = '#f6f3eb';
  context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#253d31';
  context.font = 'bold 28px sans-serif';
  context.fillText('水果连连看', SCREEN_WIDTH / 2, 248);
  context.font = '16px sans-serif';
  context.fillText('本地环境已就绪', SCREEN_WIDTH / 2, 296);
  context.fillStyle = '#637367';
  context.font = '14px sans-serif';
  context.fillText(
    inputReceived ? '输入正常' : '点击画布检查输入',
    SCREEN_WIDTH / 2,
    352,
  );
}
