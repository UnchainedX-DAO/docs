export const PROJECTS_QUERY = `*[_type == "project"] | order(order asc) {
  _id, title, slug, description, status, categories, thumbnail, url, topics, order
}`;

export const TEAM_MEMBERS_QUERY = `*[_type == "teamMember"] | order(order asc) {
  name, roles, animal, links, order
}`;
