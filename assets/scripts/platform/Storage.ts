import { sys } from 'cc';
import type { ProgressStorage } from '../core/progress';

const KEY = 'fruit-link.progress.v1';

/** Cocos maps localStorage to the browser store or WeChat's platform storage. */
export const localProgressStorage: ProgressStorage = {
  load: () => {
    const saved = sys.localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : undefined;
  },
  save: progress => { sys.localStorage.setItem(KEY, JSON.stringify(progress)); },
};
