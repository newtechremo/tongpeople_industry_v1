import {atom} from 'recoil';
import {Worker, WorkerStatus, CommuteStatus} from '@/types/user';
import {
  getStorageData,
  setStorageData,
  removeStorageData,
} from '@/utils/storage';

// AsyncStorage 영속화 Effect
const asyncStorageEffect =
  (key: string) =>
  ({setSelf, onSet, trigger}: any) => {
    const loadPersisted = async () => {
      const savedValue = await getStorageData(key);
      if (savedValue != null) {
        setSelf(savedValue);
      }
    };

    if (trigger === 'get') {
      loadPersisted();
    }

    onSet((newValue: any, _: any, isReset: any) => {
      isReset ? removeStorageData(key) : setStorageData(key, newValue);
    });
  };

export const userInfoState = atom<Worker | null>({
  key: 'userInfoState',
  default: null,
  effects: [asyncStorageEffect('userInfo')],
});

export const workerStatusState = atom<WorkerStatus>({
  key: 'workerStatusState',
  default: 'PENDING',
  effects: [asyncStorageEffect('workerStatus')],
});

export const commuteStatusState = atom<CommuteStatus>({
  key: 'commuteStatusState',
  default: 'WORK_OFF',
  effects: [asyncStorageEffect('commuteStatus')],
});
