export interface DomainMetricItem {
  domain: string;
  data: {
    moz_domain_authority?: number;
    page_rank?: number;
  };
}

export async function getDomainLinkMetrics(
  domains: string[],
  country: string,
  apiKey: string
): Promise<any> {
  const url = 'https://data.keywordseverywhere.com/service/get-domain-link-metrics';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/x.seometrics.v4+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      domains,
      country: country || 'us',
      version: '4.0.0',
      api_key: apiKey || ''
    })
  });
  return response.json();
}
