import { createStore } from "@ngneat/elf";
import { upsertEntities, withEntities } from "@ngneat/elf-entities";
import { syncState } from "elf-sync-state";

interface ProductCopyState {
  id: any;
  status: "IN_PROGRESS" | "SUCCESS" | "ERROR";
  error?: any;
  data?: any;
}

const store = createStore(
  {
    name: "products-copy-store",
  },
  withEntities<ProductCopyState>(),
);

syncState(store, {
  channel: "product-copy-channel",
});

export const ProductCopyStore = store;

export function updateProductCopy(id: any, data: any) {
  if (id) {
    ProductCopyStore.update(
      upsertEntities({
        id,
        ...data,
      }),
    );
  }
}
