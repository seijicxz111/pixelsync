export type DashboardProject = {
  id: string;
  name: string;
  description: string | null;
  visibility: "PRIVATE" | "LINK" | "PUBLIC";
  thumbnailUrl: string | null;
  updatedAt: string;
  canvases: {
    id: string;
    name: string;
    width: number;
    height: number;
    updatedAt: string;
  }[];
  members: {
    role: "OWNER" | "EDITOR" | "VIEWER";
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
  activities: {
    id: string;
    action: string;
    createdAt: string;
  }[];
};

export type ProjectDetail = DashboardProject & {
  allowGuests: boolean;
  createdAt: string;
};
