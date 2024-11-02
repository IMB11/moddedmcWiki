import MarkdownContent from "@/components/docs/markdown/MarkdownContent";
import sources, {DocumentationSource} from "@/lib/docs/sources";
import ModInfo from "@/components/docs/mod-info";
import DocsContentTitle from "@/components/docs/layout/DocsContentTitle";
import platforms, {ModProject} from "@/lib/platforms";
import ModDocsEntryPageLayout from "@/components/docs/layout/ModDocsEntryPageLayout";
import {setContextLocale} from "@/lib/locales/routing";
import DocsHomepagePlaceholder from "@/components/docs/DocsHomepagePlaceholder";
import markdown from "@/lib/markdown";
import {HOMEPAGE_FILE_PATH} from "@/lib/constants";
import DocsMarkdownContent from "@/components/docs/markdown/DocsMarkdownContent";
import {Metadata, ResolvingMetadata} from "next";

export const dynamic = 'force-static';
export const fetchCache = 'force-cache';

export async function generateMetadata({params}: {
  params: { slug: string; locale: string; version: string }
}, parent: ResolvingMetadata): Promise<Metadata> {
  let source: DocumentationSource | undefined = undefined;
  try {
    source = await sources.getBranchedProjectSource(params.slug, params.version);
  } catch (e) {
    return { title: (await parent).title?.absolute };
  }

  const project = await platforms.getPlatformProject(source.platform, source.slug);

  return {
    title: `${project.name} - ${(await parent).title?.absolute}`,
    other: {
      docs_source_mod: project.name,
      docs_source_icon: project.icon_url
    }
  }
}


async function ModHomepage({source, project, locale}: {
  source: DocumentationSource;
  project: ModProject;
  locale: string;
}) {
  // Attempt to resolve custom homepage
  try {
    const result = await markdown.renderDocumentationFile(source, [HOMEPAGE_FILE_PATH], locale);

    return <DocsMarkdownContent content={result.content.content}/>;
  } catch (e) {
    // Ignored
  }

  // File does not exist, fallback to project desc
  return (
    project.is_placeholder
      ?
      <DocsHomepagePlaceholder/>
      :
      <div>
        <MarkdownContent content={project.description}/>
      </div>
  );
}

export default async function Mod({params}: { params: { slug: string; version: string; locale: string } }) {
  setContextLocale(params.locale);

  const source = await sources.getProjectSourceOrRedirect(params.slug, params.locale, params.version);
  const project = await platforms.getPlatformProject(source.platform, source.slug);

  return (
    <ModDocsEntryPageLayout rightPanel={<ModInfo mod={project}/>}>
      <div className="flex flex-col">
        <DocsContentTitle source={source} version={params.version}>
          {project.name}
        </DocsContentTitle>

        <ModHomepage source={source} project={project} locale={params.locale} />
      </div>
    </ModDocsEntryPageLayout>
  );
}