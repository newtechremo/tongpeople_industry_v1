import {atom} from 'recoil';
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

// 토큰 상태
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
}

export const authState = atom<AuthState>({
  key: 'authState',
  default: {
    accessToken: null,
    refreshToken: null,
    isLoggedIn: false,
  },
  effects: [asyncStorageEffect('authState')],
});
