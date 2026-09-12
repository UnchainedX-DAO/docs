import { sanityClient } from "./client";
import { TEAM_MEMBERS_QUERY } from "./queries";
import type { TeamMember } from "./types";

interface RawTeamMember {
  name: string;
  roles: string[];
  animal: string;
  links?: { twitter?: string; github?: string; website?: string };
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const raw = await sanityClient.fetch<RawTeamMember[]>(TEAM_MEMBERS_QUERY);
  return raw.map((m) => ({
    name: m.name,
    role: m.roles.join(" / "),
    animal: m.animal,
    links: m.links,
  }));
}
