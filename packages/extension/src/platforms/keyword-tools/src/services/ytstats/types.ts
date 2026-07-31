export interface YtVideoItem {
  title: string;
  ownerChannelName: string;
  viewCount: number;
  ageStr: string;
  titleHasQuery: boolean;
  verified: boolean;
  addedIn7Days?: boolean;
  addedIn6Weeks?: boolean;
  difficulty?: {
    total: string;
    hint: string;
  };
  advanced?: {
    descriptionHasQuery?: boolean;
    subscribersText?: string;
    engagementScore?: string;
    viewsPerDay?: string;
    seoScore?: string;
    hint?: string;
  };
  ignore?: boolean;
}

export interface YtDataPayload {
  videoCache: {
    order: string[];
    cache: Record<string, YtVideoItem>;
  };
  avg: {
    url: string;
    query: string;
    queryEnc: string;
  };
}
