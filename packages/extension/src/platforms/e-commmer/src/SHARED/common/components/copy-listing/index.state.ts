import { createStore, withProps } from "@ngneat/elf";
import { addStoreListener, persistStorageChrome } from "../../states/common";

export enum CopyListingMarketplacesENUM {
  SHOPEE = "shopee",
  LAZADA = "lazada",
  TIKTOK = "tiktok",
  FACEBOOK = "facebook",
  WOO = "woo",
  TIKI = "tiki",
  SENDO = "sendo",
}
export interface CopyListingProps {
  marketplaces: CopyListingMarketplacesENUM[];
  isGetPriceAfterDiscount?: boolean;
}
const store = createStore(
  {
    name: "copy-listing-store",
  },
  withProps<CopyListingProps>({
    marketplaces: [
      CopyListingMarketplacesENUM.SHOPEE,
      CopyListingMarketplacesENUM.LAZADA,
      CopyListingMarketplacesENUM.TIKTOK,
    ],
    isGetPriceAfterDiscount: false,
  }),
);

persistStorageChrome(store);

addStoreListener(store);

export const CopyListingStore = store;
