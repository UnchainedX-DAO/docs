import { sanityClient } from "./client";
import { PROJECTS_QUERY } from "./queries";
import type { Project } from "./types";

export async function listProjects(): Promise<Project[]> {
  return sanityClient.fetch<Project[]>(PROJECTS_QUERY);
}
