export const CLIENT_PAGE_SIZE_OPTIONS = [10, 30] as const;
export type ClientPageSize = (typeof CLIENT_PAGE_SIZE_OPTIONS)[number];
