export interface Category {
  name: string;
  subcategories: Record<string, string>;
}

export interface TemplateItem {
  id: string;
  name: string;
  paid: boolean;
}

export interface TemplateInput {
  type: 'text' | 'number' | 'dropdown' | 'textarea' | 'URL' | 'SERP' | 'YouTube_Video_URL';
  name: string;
  label: string;
  help_text: string;
  default_text?: string;
  options?: string; // Comma separated for dropdowns
}

export interface TemplateDetails {
  id: string;
  name: string;
  prompt: string;
  inputs?: TemplateInput[];
  grid?: string;
  paid?: boolean;
}

const API_URL = 'https://keywordseverywhere.com/service/3/';

export async function openAIFetchCategories(source?: string): Promise<Record<string, Category>> {
  const url = new URL(API_URL + 'templates/getCategories.php');
  if (source) {
    url.searchParams.set('source', source);
  }
  const response = await fetch(url);
  return response.json();
}

export async function openAIFetchTemplates(subcat: string, source?: string): Promise<Record<string, TemplateItem>> {
  const url = new URL(API_URL + 'templates/getTemplates.php');
  url.searchParams.set('subcat', subcat);
  if (source) {
    url.searchParams.set('source', source);
  }
  const response = await fetch(url);
  return response.json();
}

export async function openAIFetchTemplate(id: string, source?: string): Promise<TemplateDetails> {
  const url = new URL(API_URL + 'templates/getTemplate.php');
  url.searchParams.set('id', id);
  if (source) {
    url.searchParams.set('source', source);
  }
  const response = await fetch(url);
  return response.json();
}

export async function openAIFetchLanguages(): Promise<Record<string, string>> {
  const response = await fetch(API_URL + 'templates/getLanguages.php');
  return response.json();
}

export async function openAIFetchCountries(): Promise<Record<string, string>> {
  const response = await fetch(API_URL + 'templates/getCountries.php');
  return response.json();
}

export async function openAIFetchVoiceTones(): Promise<Record<string, string>> {
  const response = await fetch(API_URL + 'templates/getVoiceTones.php');
  return response.json();
}

export async function openAIFetchWritingStyles(): Promise<Record<string, string>> {
  const response = await fetch(API_URL + 'templates/getWritingStyles.php');
  return response.json();
}

export async function openAIfetchPersuasions(): Promise<Record<string, string>> {
  const response = await fetch(API_URL + 'templates/getPersuasions.php');
  return response.json();
}
