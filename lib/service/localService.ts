import {DocumentationPage, LayoutTree, Mod, ModSearchResults, ServiceProvider} from "@/lib/service/index";
import sources, {DocumentationSource} from "@/lib/docs/sources";
import {AssetLocation} from "../assets";
import assetsFacade from "@/lib/facade/assetsFacade";
import platforms from "@/lib/platforms";

async function getProjectSource(slug: string): Promise<DocumentationSource | null> {
  const localSources = await sources.getLocalDocumentationSources();
  const src = localSources.find(s => s.id === slug);
  return src || null;
}

async function getMod(slug: string): Promise<Mod | null> {
  const src = await getProjectSource(slug);
  if (src) {
    return sourceToMod(src)
  }
  return null;
}

async function sourceToMod(src: DocumentationSource): Promise<Mod> {
  const project = await platforms.getPlatformProject(src.platform, src.slug);

  return {
    id: src.id,
    name: project.name,
    platform: src.platform,
    slug: src.slug,
    is_community: src.is_community,
    is_public: false,
    local: true
  };
}

async function getBackendLayout(slug: string, version: string | null, locale: string | null): Promise<LayoutTree | null> {
  const src = await getProjectSource(slug);
  if (src) {
    const mod = await sourceToMod(src)
    const tree = await sources.readDocsTree(src, locale || undefined);
    return {
      mod,
      tree
    }
  }
  return null;
}

async function getAsset(slug: string, location: string, version: string | null): Promise<AssetLocation | null> {
  const src = await getProjectSource(slug);
  if (src) {
    return assetsFacade.getAssetResource(location, src);
  }
  return null;
}

async function getDocsPage(slug: string, path: string[], version: string | null, locale: string | null): Promise<DocumentationPage | null> {
  const src = await getProjectSource(slug);
  if (src) {
    const project = await platforms.getPlatformProject(src.platform, src.slug);

    const mod: Mod = {
      id: src.id,
      name: project.name,
      platform: src.platform,
      slug: src.slug,
      is_community: src.is_community,
      is_public: false,
      local: true
    };
    const file = await sources.readDocsFile(src, path, locale || undefined);
    return {
      mod,
      content: file.content,
      updated_at: file.updated_at
    }
  }
  return null;
}

async function invalidateCache(slug: string) {
  // No op
}

async function searchMods(query: string, page: number): Promise<ModSearchResults> {
  return {pages: 0, total: 0, data: []};
}

export default {
  getBackendLayout,
  getAsset,
  getDocsPage,
  invalidateCache,
  getMod,
  searchMods
} satisfies ServiceProvider;