export const routes = {
  home: () => "/",
  post: (slug) => `/post/${encodeURIComponent(slug)}`,
  category: (cat) => `/category/${encodeURIComponent(cat)}`,
  author: (name) => `/author/${encodeURIComponent(name)}`,
  authors: () => "/authors",
};
