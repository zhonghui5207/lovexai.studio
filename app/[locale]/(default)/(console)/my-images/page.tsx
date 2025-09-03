import { getTranslations } from "next-intl/server";
import MyImagesClientSWR from "./client-swr";

export default async function MyImagesPage() {
  const t = await getTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <MyImagesClientSWR />
    </div>
  );
}