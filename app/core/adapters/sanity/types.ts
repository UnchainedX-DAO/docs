export type ProjectStatus = "In Dev" | "Live" | "Archived";

export interface Project {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  status: ProjectStatus;
  categories: string[];
  /** Resolved image URL (undefined → GenerativeThumb fallback in the scene). */
  thumbnail?: string;
  url?: string;
  topics: string[];
  order: number;
}
