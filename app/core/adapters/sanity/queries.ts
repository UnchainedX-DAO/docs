export const PROJECTS_QUERY = `*[_type == "project"] | order(order asc) {
  _id, title, slug, description, status, categories, thumbnail, url, topics, order
}`;
