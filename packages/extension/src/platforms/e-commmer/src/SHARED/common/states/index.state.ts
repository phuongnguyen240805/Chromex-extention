import { createStore, withProps } from "@ngneat/elf";
import { persistStorageChrome, addStoreListener } from "./common";
export interface GlobalConfigs {
  lang: "vi";
  content: {
    openPanel: boolean;
    detailProductActiveTab: string;
    currentPosition: {
      x: number;
      y: number;
    };
    tabId: number;
    hideAnalytics: boolean;
  };
}
const store = createStore(
  {
    name: "global-configs-store",
  },
  withProps<GlobalConfigs>({
    content: {
      openPanel: true,
      detailProductActiveTab: "copy",
      currentPosition: {
        x: 0,
        y: 0,
      },
      tabId: 0,
      hideAnalytics: false,
    },
    lang: "vi",
  }),
);

persistStorageChrome(store);

addStoreListener(store);

export const GlobalConfigsStore = store;

export function controlContentShowPanel(show: boolean) {
  GlobalConfigsStore.update((s) => ({
    ...s,
    content: {
      ...s.content,
      openPanel: show,
    },
  }));
}
