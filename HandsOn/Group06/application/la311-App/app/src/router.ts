/**
 * Routing via hash: ogni vista è un link condivisibile.
 *   #/                     mappa (Mockup A)
 *   #/request/<SR>         mappa + scheda record (Mockup B)
 *   #/districts            distretti ⋈ Wikidata
 *   #/graph                il grafo nel suo insieme
 *   #/resource/<IRI>       resource browser (qualunque IRI, locale o Wikidata)
 */
export type Route =
  | { name: 'map' }
  | { name: 'request'; sr: string }
  | { name: 'districts' }
  | { name: 'graph' }
  | { name: 'resource'; iri: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '');
  let m: RegExpExecArray | null;
  if ((m = /^\/request\/([\w-]+)$/.exec(path))) return { name: 'request', sr: decodeURIComponent(m[1]) };
  if ((m = /^\/resource\/(.+)$/.exec(path))) return { name: 'resource', iri: decodeURIComponent(m[1]) };
  if (path === '/districts') return { name: 'districts' };
  if (path === '/graph') return { name: 'graph' };
  return { name: 'map' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'request':
      return `#/request/${encodeURIComponent(route.sr)}`;
    case 'resource':
      return `#/resource/${encodeURIComponent(route.iri)}`;
    case 'districts':
      return '#/districts';
    case 'graph':
      return '#/graph';
    default:
      return '#/';
  }
}

export const resourceHref = (iri: string) => href({ name: 'resource', iri });
