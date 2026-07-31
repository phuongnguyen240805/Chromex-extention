import { createStore, withProps } from "@ngneat/elf";
import { persistStorageChrome, addStoreListener } from "./common";
import { syncState } from "elf-sync-state";
export interface IUser {
  token: string;
  uid: string;
  displayName: string;
  photoURL: string;
}
const store = createStore(
  {
    name: "user-store",
  },
  withProps<IUser>({} as any),
);

persistStorageChrome(store);

addStoreListener(store);

syncState(store, {
  channel: "user-store-channel",
});

export const UserStore = store;
