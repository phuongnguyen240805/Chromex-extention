export const apiClient = {
  get: async (url: string) => { /* implementation */ },
  post: async (url: string, data: any) => { /* implementation */ },
};

export const storage = {
  get: async (key: string) => { /* implementation */ },
  set: async (key: string, value: any) => { /* implementation */ },
};

export const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
};
