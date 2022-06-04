import { createRenderer } from '../../lib/plasticine-mini-vue.esm.js';
import { App } from './App.js';

const WIDTH = document.documentElement.clientWidth;
const HEIGHT = document.documentElement.clientHeight;

const init = () => {
  const app = new PIXI.Application({
    width: WIDTH,
    height: HEIGHT,
  });
  document.body.append(app.view);

  renderer.createApp(App).mount(app.stage);
};

const renderer = createRenderer({
  createElement(type) {
    const drawRect = () => {
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0x92b4ec);
      graphics.drawRect(WIDTH / 2 - 50, HEIGHT / 2 - 50, 100, 100);
      graphics.endFill();

      return graphics;
    };

    switch (type) {
      case 'rect':
        return drawRect();
      default:
        break;
    }
  },
  patchProp(el, key, value) {
    el[key] = value;
  },
  insert(el, container) {
    // addChild 是 PIXI 提供的 API
    container.addChild(el);
  },
});

init();
