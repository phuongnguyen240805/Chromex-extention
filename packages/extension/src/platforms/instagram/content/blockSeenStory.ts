(async () => {
  console.log("FB AIO: Insta block seen story ENABLED");

  const { notify } = await import("../../../contents/core/helper");
  const { hookXHR } = await import("../../../contents/core/ajax-hook");
  hookXHR({
    onBeforeSend: ({ method, url, async, user, password }: any, dataSend: any) => {
      let s = dataSend?.toString() || "";
      if (s.includes("viewSeenAt") || s.includes("SeenMutation")) {
        notify({
          msg: "👀 FB AIO: instagram story seen BLOCKED",
        });
        return null;
      }
    },
  });
})();
