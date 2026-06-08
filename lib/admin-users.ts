export type AdminUserListItem = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  favoritesCount: number;
  promptRunsCount: number;
};

export type AdminUserDetail = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  updatedAt: string;
  favorites: Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;
  promptRuns: Array<{
    id: string;
    dutyTitle: string;
    provider: string | null;
    model: string | null;
    createdAt: string;
  }>;
};
