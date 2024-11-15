import localService from "@/lib/service/localService";
import remoteService from "@/lib/service/remoteService";
import {AssetLocation} from "../assets";
import assetsFacade from "@/lib/facade/assetsFacade";
import {ModPlatform} from "@/lib/platforms/universal";
import markdown, {DocumentationMarkdown} from "@/lib/markdown";
import {DEFAULT_RSLOC_NAMESPACE} from "@/lib/util/resourceLocation";
import {DEFAULT_DOCS_VERSION, DEFAULT_LOCALE} from "@/lib/constants";

export interface Mod {
  id: string;
  name: string;
  platform: ModPlatform;
  slug: string;
  source_repo?: string;
  is_community: boolean;
  is_public: boolean;
  versions?: Record<string, string>;
  local?: boolean;
}

export interface FileTreeEntry {
  name: string;
  path: string;
  icon?: string;
  type: 'dir' | 'file';
  children: FileTree;
}

export type FileTree = FileTreeEntry[];

export interface LayoutTree {
  mod: Mod;
  tree: FileTree;
}

export interface DocumentationPage {
  mod: Mod;
  content: string;
  updated_at?: Date;
  edit_url?: string;
}

export interface RenderedDocsPage {
  mod: Mod;
  content: DocumentationMarkdown;
  updated_at?: Date;
  edit_url?: string;
}

export interface ServiceProvider {
  getBackendLayout: (slug: string, version: string | null, locale: string | null) => Promise<LayoutTree | null>;
  getAsset: (slug: string, location: string, version: string | null) => Promise<AssetLocation | null>;
  getDocsPage: (slug: string, path: string[], version: string | null, locale: string | null) => Promise<DocumentationPage | null>;
  invalidateCache: (slug: string) => Promise<void>;
}

async function getBackendLayout(slug: string, version: string, locale: string): Promise<LayoutTree | null> {
  const actualVersion = version == DEFAULT_DOCS_VERSION ? null : version;
  const actualLocale = locale == DEFAULT_LOCALE ? null : locale;

  if (process.env.LOCAL_DOCS_ROOTS) {
    const localLayout = await localService.getBackendLayout(slug, actualVersion, actualLocale);
    if (localLayout) {
      return localLayout;
    }
  }
  return remoteService.getBackendLayout(slug, actualVersion, actualLocale);
}

// TODO Improve asset resolution
async function getAsset(slug: string | null, location: string, version: string | null): Promise<AssetLocation | null> {
  // For builtin assets
  if (!slug || slug === DEFAULT_RSLOC_NAMESPACE || location.startsWith(`${DEFAULT_RSLOC_NAMESPACE}:`) || !location.includes(':')) {
    return assetsFacade.getAssetResource(location);
  }

  const actualVersion = version == DEFAULT_DOCS_VERSION ? null : version;

  if (process.env.LOCAL_DOCS_ROOTS) {
    const asset = await localService.getAsset(slug, location, actualVersion);
    if (asset) {
      return asset;
    }
  }

  return remoteService.getAsset(slug, location, actualVersion);
}

async function getDocsPage(slug: string, path: string[], version: string, locale: string): Promise<DocumentationPage | null> {
  const actualVersion = version == DEFAULT_DOCS_VERSION ? null : version;
  const actualLocale = locale == DEFAULT_LOCALE ? null : locale;

  if (process.env.LOCAL_DOCS_ROOTS) {
    const localPage = await localService.getDocsPage(slug, path, actualVersion, actualLocale);
    if (localPage) {
      return localPage;
    }
  }
  return remoteService.getDocsPage(slug, path, actualVersion, actualLocale);
}

async function renderDocsPage(slug: string, path: string[], version: string, locale: string): Promise<RenderedDocsPage | null> {
  const raw = await getDocsPage(slug, path, version, locale);
  if (raw) {
    const content = await markdown.renderDocumentationMarkdown(raw.content);
    return {
      mod: raw.mod,
      content,
      edit_url: raw.edit_url,
      updated_at: raw.updated_at
    };
  }
  return null;
}

async function invalidateCache(slug: string) {
  if (process.env.LOCAL_DOCS_ROOTS) {
      return localService.invalidateCache(slug);
  }
  return remoteService.invalidateCache(slug);
}

export default {
  getBackendLayout,
  getAsset,
  getDocsPage,
  renderDocsPage,
  invalidateCache
}