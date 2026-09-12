export type ProjectStatus = "In Dev" | "Live" | "Archived";

export interface Project {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  status: ProjectStatus;
  categories: string[];
  thumbnail?: { asset: { _ref: string } };
  url?: string;
  topics: string[];
  order: number;
}

export interface TeamMember {
  name: string;
  role: string;
  animal: string;
  isHiring?: boolean;
  links?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
}
