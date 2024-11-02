import ItemDisplay from "@/components/docs/shared/util/ItemDisplay";
import {getParams} from "@nimpl/getters/get-params";
import sources from "@/lib/docs/sources";
import type {ImgHTMLAttributes} from "react";
import assetsFacade from "@/lib/facade/assetsFacade";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { location: string };

export default async function ModAsset({ location, ...props }: Props) {
  const params = getParams() || {};
  const source = params.slug ? await sources.getProjectSource(params.slug as string) : undefined; 
  const resultAsset = await assetsFacade.getAssetResource(location, source);

  return resultAsset ? <ItemDisplay asset={resultAsset} {...props} /> : <span className="bg-accent p-0.5">{location}</span>
}