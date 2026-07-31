import { persistState } from "@ngneat/elf-persist-state";
import { isEqual } from "lodash";

const storeListener: any[] = [];

export function persistStorageChrome(store: any) {
  // Sử dụng persistState để lưu vào chrome.storage.local
  persistState(store, {
    storage: {
      getItem: (key) =>
        new Promise((resolve) =>
          chrome.storage.local.get(key, (result) => resolve(result[key])),
        ),
      setItem: (key, value) => chrome.storage.local.set({ [key]: value }),
      removeItem: (key) => chrome.storage.local.remove(key),
    },
  });
}

export function addStoreListener(store: any) {
  storeListener.push(store);
}

// listen chrome.storage change, if distint data, update store
chrome.storage.onChanged.addListener((changes) => {
  storeListener.forEach((store) => {
    if (changes[`${store.name}@store`]) {
      const changeData = changes[`${store.name}@store`];
      //check if NewValue is different from OldValue
      if (!isEqual(changeData.newValue, changeData.oldValue)) {
        store.update(() => changeData.newValue);
      }
    }
  });
});

export async function sendMessageToBackground(func: string, params?: any) {
  return new Promise((r) => {
    chrome.runtime.sendMessage(
      {
        func,
        params: params || {},
      },
      (response) => {
        r(response);
      },
    );
  }) as Promise<any>;
}
