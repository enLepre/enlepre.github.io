export function articleHref(section, id, base = '/Personal-Blog') {
  const path = id.split('/').map(encodeURIComponent).join('/');
  return `${base.replace(/\/$/, '')}/${section}/${path}.html`;
}
