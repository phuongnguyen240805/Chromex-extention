import { notify } from "../../../contents/core/helper";
import { hookXHR } from "../../../contents/core/ajax-hook";

export const initBlockSeenStory = (settings: any) => {
  console.log("FB AIO: FB block seen story ENABLED");

  if (settings.blockSeenStory === false) {
    console.log("FB AIO: block seen story DISABLED by config");
    return;
  }

  hookXHR({
    onBeforeSend: ({ method, url, async, user, password }: any, dataSend: any) => {
      if (
        method === "POST" &&
        dataSend?.toString?.()?.includes?.("storiesUpdateSeenStateMutation")
      ) {
        notify({ msg: "👀 FB AIO: facebook story seen BLOCKED" });
        return null;
      }
    },
  });
};
