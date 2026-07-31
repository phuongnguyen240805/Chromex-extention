interface HookConfig {
  fn: Function;
  arr: any[];
}

function hook(configs: HookConfig[] = []) {
  const unsubFn: (() => void)[] = [];
  for (const { fn, arr } of configs) {
    if (typeof fn !== "function" || !Array.isArray(arr)) continue;
    const id = randId();
    arr.push({ fn, id });
    unsubFn.push(() => {
      const index = arr.findIndex((e: any) => e.id === id);
      if (index !== -1) arr.splice(index, 1);
    });
  }

  return () => {
    unsubFn.forEach((fn) => fn?.());
  };
}

function randId() {
  return Math.random().toString(36).slice(2);
}

// #region FETCH
const onBeforeFetchFn: any[] = [];
const onAfterFetchFn: any[] = [];
let readyFetch = false;

function initFetch() {
  const originalFetch = window.fetch;
  window.fetch = (async function (urlOrRequest: RequestInfo | URL, options?: RequestInit) {
    let url = urlOrRequest;
    if (urlOrRequest instanceof Request) {
      url = urlOrRequest?.url;
      options = options || {};
      for (const key in urlOrRequest) {
        const type = typeof (urlOrRequest as any)[key];
        if (type === "string" || type === "number" || type === "boolean") {
          (options as any)[key] = (urlOrRequest as any)[key];
        }
      }
    }

    let request = { url, options };
    for (const { fn } of onBeforeFetchFn) {
      const res = await fn?.(request.url, request.options)?.catch(
        console.error
      );
      if (res) request = res;
      if (res === null) return null as any;
    }

    if (urlOrRequest instanceof Request) {
      try {
        if (urlOrRequest.url !== (request.url as string)) {
          urlOrRequest = new Request(request.url as string, urlOrRequest);
        }
      } catch (e) {
        debugger;
      }
    }

    let response = await originalFetch(urlOrRequest, options);
    for (const { fn } of onAfterFetchFn) {
      const res = await fn?.(request.url, request.options, response)?.catch(
        console.error
      );
      if (res) response = res;
      if (res === null) return null as any;
    }

    return response;
  }) as any;
}

export function hookFetch({ onBefore, onAfter }: any = {}) {
  if (!readyFetch) {
    initFetch();
    readyFetch = true;
  }
  return hook([
    { fn: onBefore, arr: onBeforeFetchFn },
    { fn: onAfter, arr: onAfterFetchFn },
  ]);
}

/* hookFetch example
  hookFetch({
    onBefore: (url, options) => {
      console.log(url, options);
      return null; // return null to cancel fetch
    },
    onAfter: (url, options, response) => {
      console.log(url, options, response);
      reponse.a = 1; // modify response
      return response;

      return null; // return null to prevent receiver to get response
    },
  });
  */

// #endregion

// #region XHR
const onBeforeOpenXHRFn: any[] = [];
const onBeforeSendXHRFn: any[] = [];
const onAfterSendXHRFn: any[] = [];
let readyXhr = false;

function initXhr() {
  const orig = window.XMLHttpRequest;
  (window as any).XMLHttpRequest = new Proxy(orig, {
    construct(target: any, args: any[]) {
      const instance = new target(...args);
      let p: any;

      const open = instance.open;
      instance.open = (async function (
        this: any,
        method: string,
        url: string | URL,
        async: boolean,
        user?: string | null,
        password?: string | null,
        ...rest: any[]
      ) {
        p = { method, url, async, user, password };
        for (const { fn } of onBeforeOpenXHRFn) {
          const res = await fn?.(p);
          if (res) p = res;
          if (res === null) return;
        }

        return open.apply(this, [
          p.method,
          p.url,
          p.async,
          p.user,
          p.password,
          ...rest,
        ] as any);
      }) as any;

      const send = instance.send;
      instance.send = (async function (this: any, dataSend: any) {
        for (const { fn } of onBeforeSendXHRFn) {
          const res = await fn?.(p, dataSend);
          if (res) dataSend = res;
          if (res === null) return;
        }

        instance.addEventListener("load", function () {
          for (const { fn } of onAfterSendXHRFn)
            fn?.(p, dataSend, instance.response);
        });

        return send.apply(this, [dataSend]);
      }) as any;
      return instance;
    },
  });
}

export function hookXHR({ onBeforeOpen, onBeforeSend, onAfterSend }: any = {}) {
  if (!readyXhr) {
    initXhr();
    readyXhr = true;
  }
  return hook([
    { fn: onBeforeOpen, arr: onBeforeOpenXHRFn },
    { fn: onBeforeSend, arr: onBeforeSendXHRFn },
    { fn: onAfterSend, arr: onAfterSendXHRFn },
  ]);
}

/* hookXHR example
  hookXHR({
    onBeforeOpen: ({method, url, async, user, password}) => {
      return {...}; // modify any property
      return null; // return null to cancel xhr open
    },
    onBeforeSend: ({method, url, async, user, password}, dataSend) => {
      return {...}; // modify dataSend
      return null; // return null to cancel xhr send
    },
    onAfterSend: ({method, url, async, user, password}, dataSend, response) => {
      doSomething(); // not support modify reponse yet
    }
  });
  */

// #endregion

// #region WebSocket - Experimental - WORKING IN PROGRESS
const modifyUrlWsFn: any[] = [];
const onBeforeWSFn: any[] = [];
const onAfterWSFn: any[] = [];
let readyWs = false;

function initWS() {
  const _WS = WebSocket;
  (window as any).WebSocket = function (this: any, url: string | URL, protocols: string | string[]) {
    let WSObject: any;
    for (let { fn } of modifyUrlWsFn) {
      let _url = fn?.(url);
      if (_url) url = _url;
      if (_url === null) return null as any;
    }
    this.url = url;
    this.protocols = protocols;
    if (!this.protocols) {
      WSObject = new _WS(url);
    } else {
      WSObject = new _WS(url, protocols);
    }

    const _send = WSObject.send;
    WSObject.send = function (this: any) {
      let arg0 = arguments[0];
      for (const { fn } of onBeforeWSFn) {
        const res = fn?.(arg0, WSObject.url, WSObject);
        if (res) arg0 = res;
        if (res === null) return;
      }
      arguments[0] = arg0;
      _send.apply(this, arguments as any);
    };

    // Events needs to be proxied and bubbled down.
    WSObject._addEventListener = WSObject.addEventListener;
    WSObject.addEventListener = function (this: any) {
      const eventThis = this;
      // if eventName is 'message'
      if (arguments[0] === "message") {
        arguments[1] = (function (userFunc) {
          return async function (this: any) {
            let arg0 = arguments[0];
            for (const { fn } of onAfterWSFn) {
              const res = await fn?.(
                new (MutableMessageEvent as any)(arg0),
                WSObject.url,
                WSObject
              );
              if (res) arg0 = res;
              if (res === null) return;
            }
            arguments[0] = arg0;
            userFunc.apply(eventThis, arguments);
          };
        })(arguments[1]);
      }
      return WSObject._addEventListener.apply(this, arguments);
    };

    Object.defineProperty(WSObject, "onmessage", {
      set: function (this: any) {
        const eventThis = this;
        const userFunc = arguments[0];
        const onMessageHandler = async function (this: any) {
          let arg0 = arguments[0];
          for (const { fn } of onAfterWSFn) {
            const res = await fn?.(
              new (MutableMessageEvent as any)(arg0),
              WSObject.url,
              WSObject
            );
            if (res) arg0 = res;
            if (res === null) return;
          }
          arguments[0] = arg0;
          userFunc.apply(eventThis, arguments);
        };
        WSObject._addEventListener.apply(this, [
          "message",
          onMessageHandler,
          false,
        ]);
      },
    });

    return WSObject;
  };
}

// WARNING: experimental
export function hookWS({ onBefore, onAfter, modifyUrl }: any = {}) {
  if (!readyWs) {
    initWS();
    readyWs = true;
  }
  return hook([
    { fn: modifyUrl, arr: modifyUrlWsFn },
    { fn: onBefore, arr: onBeforeWSFn },
    { fn: onAfter, arr: onAfterWSFn },
  ]);
}

/* hookWS example
  hookWS({
    modifyUrl: (url) => {
      url += "_modified";
      return url;

      return null; // return null to cancel ws open
    },
    onBefore: (data, url, wsObject) => {
      data += "_modified";
      return data;

      return null; // return null to cancel ws send
    },
    onAfter: (e, url, wsObject) => {
      console.log("Received message from " + url + " : " + messageEvent.data);
      // This example can ping-pong forever, so maybe use some conditions
      wsObject.send("Intercepted and sent again")
      return null;
    }
  });
  */

// Mutable MessageEvent.
// Subclasses MessageEvent and makes data, origin and other MessageEvent properites mutatble.
function MutableMessageEvent(this: any, o: any) {
  this.bubbles = o.bubbles || false;
  this.cancelBubble = o.cancelBubble || false;
  this.cancelable = o.cancelable || false;
  this.currentTarget = o.currentTarget || null;
  this.data = o.data || null;
  this.defaultPrevented = o.defaultPrevented || false;
  this.eventPhase = o.eventPhase || 0;
  this.lastEventId = o.lastEventId || "";
  this.origin = o.origin || "";
  this.path = o.path || new Array(0);
  this.ports = o.parts || new Array(0);
  this.returnValue = o.returnValue || true;
  this.source = o.source || null;
  this.srcElement = o.srcElement || null;
  this.target = o.target || null;
  this.timeStamp = o.timeStamp || null;
  this.type = o.type || "message";
  Object.setPrototypeOf(this, o.__proto__ || (MessageEvent as any).__proto__);
}

// #endregion
