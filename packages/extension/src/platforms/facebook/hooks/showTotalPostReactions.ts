import { notify, getNumberFormatter } from "../../../contents/core/helper";
import { hookXHR } from "../../../contents/core/ajax-hook";
import { fetchGraphQl, getFbdtsg } from "../services/fb-helper";

export const initShowTotalPostReactions = (settings: any) => {
  console.log("FB AIO: FB show total post reactions ENABLED");

  if (settings.showReactions === false) {
    console.log("FB AIO: show reactions DISABLED by config");
    return;
  }

  const CACHED: Record<string, any> = {};
  const ReactionId = {
    "👍": "1635855486666999",
    "💖": "1678524932434102",
    "🥰": "613557422527858",
    "😆": "115940658764963",
    "😲": "478547315650144",
    "😔": "908563459236466",
    "😡": "444813342392137",
  };

  const getPostReactionsCount = async (id: string, reactionId: string) => {
    const res = await fetchGraphQl(
      {
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "CometUFIReactionIconTooltipContentQuery",
        variables: {
          feedbackTargetID: id,
          reactionID: reactionId,
        },
        doc_id: "6235145276554312",
      },
      await getFbdtsg()
    );
    const json = JSON.parse(res || "{}");
    return json?.data?.feedback?.reactors?.count || 0;
  };

  const getTotalPostReactionCount = async (id: string) => {
    if (CACHED[id] === "loading") return;

    const { setText, closeAfter } = notify({
      msg: "❤️ FB AIO: Counting reactions...",
      duration: 10000,
    });
    const numberFormater = getNumberFormatter("standard", undefined);

    let res;
    if (CACHED[id]) {
      res = CACHED[id];
    } else {
      CACHED[id] = "loading";
      res = {
        total: 0,
        each: {} as Record<string, any>,
      };
      for (let [name, reactionId] of Object.entries(ReactionId)) {
        const count = await getPostReactionsCount(id, reactionId);
        res.total += count;
        res.each[name] = count;
        setText(
          `❤️ FB AIO: Counting reactions ${name}... Total: ${numberFormater.format(
            res.total
          )}`,
          undefined
        );
      }
      CACHED[id] = res;
    }

    setText(
      "<p style='color:white;font-size:20px;padding:0;margin:0'>Total " +
        numberFormater.format(res.total) +
        " reactions.<br/>Includes " +
        Object.entries(res.each)
          .filter(([key, value]: [string, any]) => value > 0)
          .map(([key, value]: [string, any]) => `${numberFormater.format(value)}${key}`)
          .join(", ") +
          "</p>",
      undefined
    );
    closeAfter(10000);
  };

  hookXHR({
    onAfterSend: (
      { method, url, async, user, password }: any,
      dataSend: any,
      response: any
    ) => {
      let str = dataSend?.toString?.() || "";
      if (
        str.includes("CometUFIReactionsCountTooltipContentQuery") ||
        str.includes("CometUFIReactionIconTooltipContentQuery")
      ) {
        try {
          const json = JSON.parse(response);
          if (
            json?.data?.feedback?.reaction_display_config
              ?.reaction_display_strategy == "HIDE_COUNTS"
          ) {
            const id = json.data.feedback.id;
            getTotalPostReactionCount(id);
          }
        } catch (err) {
          console.log(err);
        }
      }
    },
  });
};
