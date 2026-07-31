export interface OnPageItem {
  exactMatchesTitle: number;
  exactMatchesURL: number;
  exactMatchesDescr: number;
  broadMatchesTitle: number;
  broadMatchesURL: number;
  broadMatchesDescr: number;
  boldPoints: number;
  sum: number;
}

export interface SerpItem {
  index?: number;
  url: string;
  title: string;
  description: string;
  descriptionBold: string[];
  descriptionOptimized?: boolean;
  domain: string;
  onpage: OnPageItem;
}

export interface DifficultyPayload {
  title: string;
  countryTitle: string;
  btnURL: string;
  query: string;
  queryQuotes: string;
  onpage: {
    avg: number;
    data: SerpItem[];
  };
  offpage: {
    avg: number;
    data: Record<string, {
      page_rank: number;
      moz_domain_authority: number;
      sum: number;
    }>;
  };
  difficulty: number;
  branded: boolean;
}

export interface CombinedRowData {
  index: number;
  url: string;
  title: string;
  description: string;
  serpHighlights: string;
  domain: string;
  mozDA: number | string;
  pageRank: number | string;
  offpageSum: number | string;
  onpage: OnPageItem;
}
