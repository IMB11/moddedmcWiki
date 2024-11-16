import {DocumentationPage, LayoutTree, Mod, ModSearchResults, ServiceProvider} from "@/lib/service/index";
import {AssetLocation} from "@/lib/assets";

interface AssetResponse {
  data: string;
}

interface PageResponse {
  mod: Mod;
  content: string;
  edit_url?: string;
  updated_at?: string;
}

async function fetchBackendService(path: string, params: Record<string, string | null> = {}, method?: string, disableCache?: boolean) {
  if (!process.env.BACKEND_SERVICE_URL) {
    throw new Error('Environment variable BACKEND_SERVICE_URL not set');
  }
  const searchParams = new URLSearchParams();
  for (const key in params) {
    if (params[key] != null) {
      searchParams.set(key, params[key]);
    }
  }
  return fetch(`${process.env.BACKEND_SERVICE_URL}/api/v1/${path}?${searchParams.toString()}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.BACKEND_API_KEY}`
    },
    ...(disableCache ? {cache: 'no-store'} : {
      next: {
        tags: params.mod ? [`backend:${params.mod || ''}`] : [] // TODO Ensure error responses are cached
      }
    })
  });
}

async function getMod(mod: string): Promise<Mod | null> {
  try {
    const resp = await fetchBackendService(`mod/${mod}`);
    if (resp.ok) {
      const json = await resp.json();
      return json.mod;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function getBackendLayout(mod: string, version: string | null, locale: string | null): Promise<LayoutTree | null> {
  try {
    const resp = await fetchBackendService(`mod/${mod}/tree`, {version, locale});
    if (resp.ok) {
      return resp.json();
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function getAsset(mod: string, location: string, version: string | null): Promise<AssetLocation | null> {
  try {
    const resp = await fetchBackendService(`mod/${mod}/asset/${location}`, {version});
    if (resp.ok) {
      const json = await resp.json() as AssetResponse;
      return {
        id: location,
        src: json.data
      }
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function getDocsPage(mod: string, path: string[], version: string | null, locale: string | null): Promise<DocumentationPage | null> {
  try {
    const resp = await fetchBackendService(`mod/${mod}/page/${path.join('/')}.mdx`, {version, locale});
    if (resp.ok) {
      const json = await resp.json() as PageResponse;
      const content = Buffer.from(json.content, 'base64').toString('utf-8');
      return {
        mod: json.mod,
        content,
        edit_url: json.edit_url,
        updated_at: json.updated_at ? new Date(json.updated_at) : undefined
      }
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function invalidateCache(mod: string) {
  try {
    await fetchBackendService(`mod/${mod}/invalidate`, {}, 'POST');
  } catch (e) {
    console.error(e);
  }
}

async function searchMods(query: string, page: number): Promise<ModSearchResults> {
  try {
    const resp = await fetchBackendService(`browse`, {query, page: page.toString()}, 'GET', true);
    if (resp.ok) {
      return await resp.json();
    }
  } catch (e) {
    console.error(e);
  }
  return {pages: 0, total: 0, data: []};
}

export default {
  getBackendLayout,
  getAsset,
  getDocsPage,
  invalidateCache,
  getMod,
  searchMods
} satisfies ServiceProvider