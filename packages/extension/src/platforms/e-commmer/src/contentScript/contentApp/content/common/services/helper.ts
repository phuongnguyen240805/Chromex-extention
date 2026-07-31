import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { round } from "lodash";
import { GlobalConfigsStore } from "../../../../../SHARED/common/states/index.state";

// Initialize dayjs plugins
dayjs.extend(relativeTime);

export function cleanUrl(url: string) {
  // remove .webp
  url = url.replace("_.webp", "");
  url = url.replace(".webp", "");
  url = url.replace("_120x120q80.jpg", "");
  url = url.replace("_80x80q80.jpg", "");
  url = url.replace("_80x80q80.png", "");
  url = url.replace("_200x200q80.jpg", "");
  url = url.replace("_120x120q80.png", "");
  url = url.replace("_200x200q80.png", "");
  url = url.replace("_220x220q75.jpg_.avif", "");
  if (url.endsWith("_tn")) {
    url = url.replace("_tn", "");
  }

  return url;
}

export const getInnerHTMLFromSelector = (selector: string) => {
  if (!document.querySelector(selector)) {
    return null;
  }
  const data = document.querySelector(selector)?.innerHTML;
  // remove all em tag but keep content in html
  return data?.replace(/<em[^>]*>(.*?)<\/em>/g, "$1");
};

export function stripHtmlExceptImg(html: string) {
  if (!html) {
    return "";
  }

  html = html.replace(/<\/p>/g, "</p>\n");
  html = html.replace(/<\/li>/g, "</li>\n");
  html = html.replace(/<\/li>/g, "</li>\n");
  html = html.replace(/\/>/g, "/>\n");
  html = html.replace(/>/g, ">\n");
  html = html.replace(/<img/g, "\n<img");
  return html
    .replace(/(<\/?(?:img)[^>]*>)|<[^>]+>/gi, "$1")
    .replace(new RegExp('">', "gi"), '"/>');
}

export function stripHtmlExceptImgAndP(html: string) {
  if (!html) {
    return "";
  }

  html = html.replace(/<\/li>/g, "</li>\n");
  html = html.replace(/<\/li>/g, "</li>\n");
  html = html.replace(/\/>/g, "/>\n");
  html = html.replace(/>/g, ">\n");
  html = html.replace(/<img/g, "\n<img");
  return html
    .replace(/(<\/?(?:img)[^>]*>)|<[^>]+>/gi, "$1")
    .replace(new RegExp('">', "gi"), '"/>');
}
export const wait = async (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
export const DecimalSeparatorFormat = (text: string | number) =>
  text?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const formatDate = (date: any, format = "DD/MM/YYYY") => {
  //check if date is second
  if (typeof date === "number" && date.toString().length === 10) {
    date = date * 1000;
  }
  return dayjs(date).format(format);
};
export function numberSeperatorShow(
  number: any,
  showPlus: boolean = false,
  _toLocaleStringOptions?: Intl.NumberFormatOptions,
  _locales?: string,
  showTextSuffix?: boolean,
) {
  if (showTextSuffix) {
    number = number || 0;
    if (number === 0) return "0";
    const suffixes = ["", "K", "M", "B", "T"];
    const tier = Math.floor(Math.log10(Math.abs(number)) / 3); // Xác định bậc (tier)

    if (tier === 0) return number.toString(); // Nếu dưới 1K, trả về số gốc

    const scale = Math.pow(10, tier * 3); // Tính bậc số chia
    const scaled = number / scale; // Chia giá trị cho bậc số
    const rounded = round(scaled, 1); // Làm tròn đến 1 chữ số thập phân

    return `${rounded}${suffixes[tier]}`; // Trả về chuỗi kèm hậu
  }

  if (number === undefined || number === null) return "";
  return (
    `${showPlus && +number >= 0 ? "+" : ""}` + DecimalSeparatorFormat(number)
  );
}
export const mapTiersToModels = (tier: any[]) => {
  if (tier.length === 0) return [{ id: "", name: "", price: 0, stock: 0 }];
  const first = tier[0];
  const rest = tier.slice(1);
  return first.options.flatMap((opt: any, i: any) => {
    if (rest.length === 0) {
      return [
        {
          name: opt,
          stock: 1000,
          price: 0,
          sku: "",
        },
      ];
    }

    return rest[0].options.map((opt2: any) => {
      return {
        name: opt + "," + opt2,
        stock: 0,
        price: 0,
        sku: "",
      };
    });
  });
};
export function timeAgo(input: string | number | Date) {
  //check if date is second
  if (typeof input === "number" && input.toString().length === 10) {
    input = input * 1000;
  }

  return dayjs(input)
    .locale(GlobalConfigsStore.query((s) => s.lang || "vi"))
    .fromNow();
}
