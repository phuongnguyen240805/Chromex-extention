import { uniq } from "lodash";
import { fromEvent, Observable } from "rxjs";
import { UserStore } from "../common/states/user.state";
import { CopyListingMarketplacesENUM } from "../common/components/copy-listing/index.state";
import { sendMessageToBackground } from "../common/states/common";

/**
 * Tạo Observable để lắng nghe sự kiện hover (mouseenter, mouseleave)
 * @param className - Tên class của phần tử HTML
 * @returns Observable
 */
export const createHoverObservable = (
  className: string,
): Observable<{ event: string; element: HTMLElement }> => {
  const elements = document.querySelectorAll(`${className}`);

  if (elements.length === 0) {
    console.warn(`No elements found with class: ${className}`);
    return new Observable((observer) => observer.complete());
  }

  return new Observable((observer) => {
    const subscriptions = Array.from(elements).map((element) => {
      const mouseEnter$ = fromEvent(element, "mouseenter").subscribe(() => {
        observer.next({ event: "mouseenter", element: element as HTMLElement });
      });

      const mouseLeave$ = fromEvent(element, "mouseleave").subscribe(() => {
        observer.next({ event: "mouseleave", element: element as HTMLElement });
      });

      return [mouseEnter$, mouseLeave$];
    });

    // Cleanup khi hủy Observable
    return () => {
      subscriptions.forEach(([enterSub, leaveSub]) => {
        enterSub.unsubscribe();
        leaveSub.unsubscribe();
      });
    };
  });
};

export const getDataFromSessionStorage = (key: string) => {
  return new Promise((resolve) => {
    // if 10s not found data, return null
    const timer = setTimeout(() => {
      resolve(null);
    }, 10000);

    function getData() {
      const data = sessionStorage.getItem(key);
      if (data) {
        resolve(data);
        clearTimeout(timer);
      } else {
        setTimeout(getData, 300);
      }
    }

    getData();
  }) as Promise<string | null>;
};

export const getCurrentUID = () => {
  return UserStore.query((s) => s.uid);
};

function getHostname(url: string, simpleHostname?: boolean) {
  let hostname = new URL(url).hostname;
  hostname = hostname.replace("www.", "");
  const hostnamesplit = hostname.split(".");
  if (hostnamesplit.length > 2 && simpleHostname) {
    return (
      hostnamesplit[hostnamesplit.length - 2] +
      "." +
      hostnamesplit[hostnamesplit.length - 1]
    );
  }
  return hostname;
}

export async function checkProductCopyExist(
  itemId: any,
  shopId: any,
  simpleHostname?: boolean,
) {
  const ids = Object.keys(CopyListingMarketplacesENUM)
    .map((key) => {
      return `${getHostname(
        window.location.href,
        simpleHostname,
      )}_${key.toLowerCase()}_${shopId}_${itemId}_${UserStore.query(
        (s) => s.claims?.nickname || s.uid,
      )}`;
    })
    .join(",");

  const res = await sendMessageToBackground("CHECK_PRODUCT_COPY_EXIST", {
    ids,
  });

  return res as { id: any; copy_to: any }[];
}

export function waitForElementToAppear(
  selector: string,
  minNumberOfElements = 0,
): Observable<Element[]> {
  let length: number;

  return new Observable((observer) => {
    const f = () => {
      const e = document.querySelectorAll(selector);

      if (e.length >= minNumberOfElements && e.length !== length) {
        const arr: Element[] = [];
        e.forEach((n) => arr.push(n));
        observer.next(arr);
        length = e.length;
        // return
      }
      window.requestAnimationFrame(f);
    };
    f();
  });
}
const elementIsVisibleInViewport = (el: Element, partiallyVisible = false) => {
  const { top, left, bottom, right } = el.getBoundingClientRect();
  const { innerHeight, innerWidth } = window;
  return partiallyVisible
    ? ((top > 0 && top < innerHeight) ||
        (bottom > 0 && bottom < innerHeight)) &&
        ((left > 0 && left < innerWidth) || (right > 0 && right < innerWidth))
    : top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth;
};
export function waitForElementInView(element: Element): Observable<boolean> {
  let current = false;

  return new Observable((observer) => {
    const f = () => {
      if (elementIsVisibleInViewport(element, true) && !current) {
        observer.next(true);
        current = true;
        observer.complete();
      } else {
        current = false;
      }
      window.requestAnimationFrame(f);
    };
    f();
  });
}
