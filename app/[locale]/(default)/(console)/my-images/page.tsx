import { getTranslations } from "next-intl/server";
import MyImagesClient from "./client";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function MyImagesPage() {
  const t = await getTranslations();

  return (
    <DashboardLayout 
      title="My Images" 
      description="Manage and view all your AI-generated images in one place"
    >
      <MyImagesClient />
    </DashboardLayout>
  );
}