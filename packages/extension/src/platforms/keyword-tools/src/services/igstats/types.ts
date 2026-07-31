export interface IgPost {
  code: string;
  likes: number;
  comments: number;
}

export interface IgDataPayload {
  posts: IgPost[];
  maxIndex: number;
  url: string;
}

export interface IgCombinedRow {
  index: number;
  code: string;
  href: string;
  likes: number;
  comments: number;
  ignore: boolean;
}
