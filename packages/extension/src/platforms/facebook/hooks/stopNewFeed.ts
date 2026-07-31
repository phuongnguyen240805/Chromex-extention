import { hookXHR } from "../../../contents/core/ajax-hook";
import { notify } from "../../../contents/core/helper";

export const initStopNewFeed = (settings: any) => {
  console.log("FB AIO: stop new feed facebook ENABLED");

  const blackList = {
    story: [
      // "StoriesSuspenseNavigationPaneRootWithEntryPointQuery",
      // "StoriesSuspenseContentPaneRootWithEntryPointQuery",
      "StoriesTrayRectangularQuery",
      // "StoriesTrayRectangularRootQuery",
      "useStoriesViewerBucketsPaginationQuery",
    ],
    "video tab": [
      "CometVideoHomeFeedRootQuery",
      "CometVideoHomeFeedSectionPaginationQuery",
    ],
    "home tab": ["CometModernHomeFeedQuery", "CometNewsFeedPaginationQuery"],
    "group tab": [
      "GroupsCometCrossGroupFeedPaginationQuery",
      "GroupsCometCrossGroupFeedContainerQuery",
    ],
    "group feed": ["GroupsCometFeedRegularStoriesPaginationQuery"],
    "marketplace tab": [
      // "CometMarketplaceRootQuery",
      // "MarketplaceCometBrowseFeedLightContainerQuery",
      // "MarketplaceCometBrowseFeedLightPaginationQuery",
      "MarketplaceBannerContainerQuery",
      "CometMarketplaceLeftRailNavigationContainerQuery",
    ],
    "event tab": [
      // "EventCometHomeDiscoverContentRefetchQuery"
    ],
    "online status": [
      // "UpdateUserLastActiveMutation"
    ],
  };

  if (settings.stopNewFeed === false) {
    console.log("FB AIO: stop new feed facebook DISABLED by config");
    return;
  }

  let enabled = true;
  hookXHR({
    onBeforeSend: ({ method, url, async, user, password }: any, dataSend: any) => {
      let s = dataSend?.toString() || "";

      let inBlackList: string | boolean = false;
      for (const [key, value] of Object.entries(blackList)) {
        if (value.find((item) => s.includes(item))) {
          inBlackList = key;
          break;
        }
      }

      if (enabled && inBlackList) {
        notify({
          msg: "🚫 FB AIO: Stopped new feed facebook '" + inBlackList + "'",
        });
        return null;
      }
    },
  });

  return (value = !enabled) => {
    enabled = value;
    notify({
      msg:
        "FB AIO:" +
        (enabled ? "ENABLED" : "DISABLED") +
        " Stop new feed facebook ",
    });
  };
};
