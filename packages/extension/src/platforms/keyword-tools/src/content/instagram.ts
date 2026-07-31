interface IgPostItem {
  code: string;
  likes: number;
  comments: number;
}

function parseFollowers(raw: string): number {
  if (!raw || typeof raw !== 'string') return 0;
  const normalizeDigits = (str: string) => str.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) & 0xf));
  raw = normalizeDigits(raw).trim();
  const suffixes: Record<string, number> = {
    'K': 1e3, 'k': 1e3,
    'M': 1e6, 'm': 1e6,
    'B': 1e9, 'b': 1e9,
    '万': 1e4,
    '억': 1e8,
    '만': 1e4,
    'ألف': 1e3, 'مليون': 1e6
  };
  let multiplier = 1;
  for (const [suffix, factor] of Object.entries(suffixes)) {
    if (raw.includes(suffix)) {
      multiplier = factor;
      raw = raw.replace(suffix, '');
      break;
    }
  }
  const num = raw.replace(/[,\s]/g, '').replace(/[^\d.]/g, '');
  const result = parseFloat(num);
  return isNaN(result) ? 0 : Math.round(result * multiplier);
}

export function initInstagramWidget() {
  const run = () => {
    const path = window.location.pathname;
    const templates = Array.from(document.querySelectorAll("body > template"));
    
    const counts = {
      posts: 0,
      likes: 0,
      comments: 0,
      maxLikes: 0,
      maxLikesIndex: 0
    };

  let rawFollowers = "";
  const followersLink = document.querySelector('a[href$="/followers/"]');
  if (followersLink) {
    const span = followersLink.querySelector('span[title]');
    if (span) {
      rawFollowers = span.getAttribute("title") || span.textContent || "";
    } else {
      rawFollowers = followersLink.textContent || "";
    }
  }

  let followers = parseFollowers(rawFollowers);
  let isTags = false;
  const igData: IgPostItem[] = [];

  templates.forEach((template: any) => {
    if (template.dataset.path !== path) {
      template.remove();
      return;
    }

    const text = template.textContent;
    try {
      const json = JSON.parse(text);
      if (template.dataset.url && template.dataset.url.includes("fbsearch")) {
        isTags = true;
      }
      
      if (isTags && json.media_grid?.sections) {
        let index = 0;
        json.media_grid.sections.forEach((section: any) => {
          const items = section.layout_content?.fill_items || section.layout_content?.medias || [];
          items.forEach((item: any) => {
            if (item.media) {
              counts.posts++;
              const likes = item.media.like_count || 0;
              counts.likes += likes;
              if (likes > counts.maxLikes) {
                counts.maxLikes = likes;
                counts.maxLikesIndex = index;
              }
              index++;
              igData.push({
                code: item.media.code || "",
                likes,
                comments: item.media.comment_count || 0
              });
            }
          });
        });
      } else if (json.items) {
        json.items.forEach((item: any, index: number) => {
          counts.posts++;
          counts.comments += item.comment_count || 0;
          const likes = item.like_count || 0;
          counts.likes += likes;
          if (likes > counts.maxLikes) {
            counts.maxLikes = likes;
            counts.maxLikesIndex = index;
          }
          igData.push({
            code: item.code || "",
            likes,
            comments: item.comment_count || 0
          });
        });
      } else if (json.data?.xdt_api__v1__feed__user_timeline_graphql_connection?.edges) {
        const edges = json.data.xdt_api__v1__feed__user_timeline_graphql_connection.edges;
        edges.forEach((edge: any, index: number) => {
          const item = edge.node;
          if (item && typeof item.like_count !== "undefined") {
            counts.posts++;
            counts.comments += item.comment_count || 0;
            const likes = item.like_count || 0;
            counts.likes += likes;
            if (likes > counts.maxLikes) {
              counts.maxLikes = likes;
              counts.maxLikesIndex = index;
            }
            igData.push({
              code: item.code || "",
              likes,
              comments: item.comment_count || 0
            });
          }
        });
      } else if (json.data?.user?.follower_count) {
        followers = json.data.user.follower_count;
      }
    } catch (e) {
      console.warn("Keywords Everywhere: Error parsing Instagram template data", e);
    }
  });

  if (counts.posts > 0) {
    // Exclude outlier post
    const finalLikes = counts.likes - counts.maxLikes;
    const finalPosts = counts.posts - 1;

    const avgLikes = finalPosts > 0 ? Math.round(finalLikes / finalPosts) : counts.likes;
    const avgComments = finalPosts > 0 ? Math.round(counts.comments / finalPosts) : counts.comments;
    
    let engagement = "-";
    if (followers > 0) {
      engagement = ((avgLikes + avgComments) * 100 / followers).toFixed(2) + "%";
    }

    injectStatsWidget({
      isTags,
      postsCount: finalPosts || counts.posts,
      avgLikes,
      avgComments,
      engagement,
      igData,
      maxLikesIndex: counts.maxLikesIndex
    });
  }
  };

  run();
  setInterval(run, 3000);
}

interface WidgetParams {
  isTags: boolean;
  postsCount: number;
  avgLikes: number;
  avgComments: number;
  engagement: string;
  igData: IgPostItem[];
  maxLikesIndex: number;
}

function injectStatsWidget(params: WidgetParams) {
  let container = document.getElementById("xt-instagram-avg-widget");
  if (!container) {
    const siblingSelector = params.isTags ? "main [role=button]" : "main header > section";
    const sibling = document.querySelector(siblingSelector);
    if (!sibling) return;

    container = document.createElement("div");
    container.id = "xt-instagram-avg-widget";
    
    // Apply premium glassmorphic cards styles inline
    container.style.background = "rgba(15, 23, 42, 0.75)";
    container.style.border = "1px solid rgba(255, 255, 255, 0.08)";
    container.style.borderRadius = "16px";
    container.style.padding = "16px";
    container.style.marginTop = "16px";
    container.style.marginBottom = "16px";
    container.style.boxShadow = "0 8px 32px 0 rgba(0, 0, 0, 0.4)";
    container.style.backdropFilter = "blur(12px)";
    container.style.fontFamily = "system-ui, -apple-system, sans-serif";
    container.style.color = "#E2E8F0";

    sibling.parentNode?.insertBefore(container, sibling);
  }

  // Render widget content
  const logoUrl = chrome.runtime.getURL("img/icon24.png");
  
  if (params.isTags) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="${logoUrl}" style="width: 20px; height: 20px;" />
          <span style="font-weight: 700;">Instagram Tag Stats</span>
        </div>
        <div>
          <span style="color: #94A3B8;">Avg Likes:</span> <strong style="color: #F43F5E;">${params.avgLikes.toLocaleString()}</strong>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="display: flex; flex-col; gap: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-b: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${logoUrl}" style="width: 20px; height: 20px;" />
            <span style="font-weight: 800; font-size: 13px; background: linear-gradient(135deg, #F43F5E, #E11D48); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Keywords Everywhere</span>
          </div>
          <span style="font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase;">Avg Stats</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 11px; margin-bottom: 12px;">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 8px 10px; border-radius: 8px;">
            <div style="color: #64748B; font-weight: 700; margin-bottom: 2px; text-transform: uppercase; font-size: 9px;">Avg Likes</div>
            <div style="font-size: 13px; font-weight: 800; color: #F1F5F9;">${params.avgLikes.toLocaleString()}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 8px 10px; border-radius: 8px;">
            <div style="color: #64748B; font-weight: 700; margin-bottom: 2px; text-transform: uppercase; font-size: 9px;">Avg Comments</div>
            <div style="font-size: 13px; font-weight: 800; color: #F1F5F9;">${params.avgComments.toLocaleString()}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 8px 10px; border-radius: 8px;">
            <div style="color: #64748B; font-weight: 700; margin-bottom: 2px; text-transform: uppercase; font-size: 9px;">Engagement</div>
            <div style="font-size: 13px; font-weight: 800; color: #F59E0B;">${params.engagement}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #94A3B8;">
          <button id="xt-ig-view-stats-btn" style="background: linear-gradient(135deg, #EC4899, #D946EF); color: white; border: none; border-radius: 6px; padding: 4px 10px; font-weight: 700; cursor: pointer; transition: opacity 0.2s;">
            Based on ${params.postsCount} posts
          </button>
          <a href="https://keywordseverywhere.com/instagram-metrics.html" target="_blank" style="text-decoration: underline; color: #64748B; font-size: 10px; font-weight: 600;">
            How calculated
          </a>
        </div>
      </div>
    `;

    const viewBtn = container.querySelector("#xt-ig-view-stats-btn");
    if (viewBtn) {
      viewBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          cmd: "ig.setData",
          data: {
            posts: params.igData,
            maxIndex: params.maxLikesIndex,
            url: window.location.href
          }
        }, () => {
          chrome.runtime.sendMessage({
            cmd: "new_tab",
            data: chrome.runtime.getURL("tabs/igstats.html")
          });
        });
      });
    }
  }
}
