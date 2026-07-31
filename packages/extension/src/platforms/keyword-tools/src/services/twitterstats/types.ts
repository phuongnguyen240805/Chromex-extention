export interface TweetItem {
  url: string;
  replies: number;
  reposts: number;
  likes: number;
  views: number;
  ignored: boolean | string;
}

export interface TwitterDataPayload {
  tweets: TweetItem[];
  maxIndex: number;
  url: string;
}

export interface TwitterCombinedRow {
  index: number;
  href: string;
  replies: number;
  reposts: number;
  likes: number;
  views: number;
  ignore: boolean;
}
