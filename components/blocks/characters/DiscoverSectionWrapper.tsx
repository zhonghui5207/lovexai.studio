"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DiscoverSection from "./DiscoverSection";

/**
 * Client-side wrapper for DiscoverSection
 * Handles Convex data fetching while keeping the parent page as Server Component
 */
export default function DiscoverSectionWrapper() {
  const characters = useQuery(api.characters.list, { activeOnly: true });

  return <DiscoverSection characters={characters} />;
}
