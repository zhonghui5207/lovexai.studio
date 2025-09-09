import { getTranslations } from "next-intl/server";
import MyImagesClient from "./client";

export default async function MyImagesPage() {
  const t = await getTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <MyImagesClient />
    </div>
  );
}