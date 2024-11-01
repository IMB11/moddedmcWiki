import {Suspense} from "react";
import DocsEntryPage from "@/components/docs/DocsEntryPage";
import DocsLoadingSkeleton from "@/components/docs/DocsLoadingSkeleton";
import {Metadata, ResolvingMetadata} from "next";
import sources, {DocumentationSource} from "@/lib/docs/sources";
import platformsFacade from "@/lib/facade/platformsFacade";
import {setContextLocale} from "@/lib/locales/routing";
import {FOLDER_METADATA_FILE_NAME} from "@/lib/constants";

export const dynamic = 'force-static';
export const fetchCache = 'force-cache';

export async function generateMetadata({params}: {
  params: { slug: string; path: string[]; locale: string; version: string }
}, parent: ResolvingMetadata): Promise<Metadata> {
  let source: DocumentationSource | undefined = undefined;
  try {
    source = await sources.getBranchedProjectSource(params.slug, params.version);
  } catch (e) {
    return {title: (await parent).title?.absolute};
  }

  const project = await platformsFacade.getPlatformProject(source.platform, source.slug);

  let title: string | undefined = undefined;
  try {
    const folderPath = params.path.slice(0, params.path.length - 1);
    const folderMeta = await sources.parseFolderMetadataFile(source, folderPath.join('/') + '/' + FOLDER_METADATA_FILE_NAME, params.locale);
    const fileName = params.path[params.path.length - 1] + '.mdx';
    title = folderMeta[fileName].name;
  } catch (e) {
    // ignored
  }

  return {
    title: title ? `${title} - ${project.name}` : `${project.name} - ${(await parent).title?.absolute}`,
    openGraph: {
      images: [`/api/og?slug=${params.slug}&locale=${params.locale}&path=${params.path.join('/')}&version=${params.version}`]
    },
    other: {
      docs_source_mod: project.name,
      docs_source_icon: project.icon_url
    }
  }
}

export default async function ModDocsPage({params}: {
  params: { slug: string; path: string[]; locale: string; version: string; }
}) {
  setContextLocale(params.locale);
  await sources.getProjectSourceOrRedirect(params.slug, params.locale, params.version);

  return (
    <Suspense fallback={<DocsLoadingSkeleton/>}>
      <DocsEntryPage slug={params.slug} path={params.path} locale={params.locale} version={params.version}/>
    </Suspense>
  )
}