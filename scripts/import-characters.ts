/**
 * Import characters from JSON file to Convex database
 *
 * Usage: npx tsx scripts/import-characters.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";

// Read env file manually
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envLines = envContent.split("\n");
for (const line of envLines) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    if (!process.env[key.trim()]) {
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, "");
    }
  }
}

// Load the JSON data
const jsonPath = path.join(__dirname, "../test_characters_20_with_urls.json");
const charactersData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

// Convex client - uses CONVEX_URL from environment
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!convexUrl) {
  console.error("❌ Error: CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  console.log("Please set it in your .env.local file");
  process.exit(1);
}

console.log(`🔗 Connecting to Convex: ${convexUrl.substring(0, 30)}...`);
const client = new ConvexHttpClient(convexUrl);

async function importCharacters() {
  console.log("🚀 Starting character import...");
  console.log(`📁 Loading ${charactersData.length} characters from JSON file`);

  try {
    const result = await client.mutation(api.characters.bulkImport, {
      characters: charactersData,
    });

    console.log("\n✅ Import completed successfully!");
    console.log(`📊 Total characters processed: ${result.count}`);
    console.log("\n📝 Details:");

    for (const item of result.results) {
      const emoji = item.action === "created" ? "🆕" : "🔄";
      console.log(`  ${emoji} ${item.username}: ${item.action}`);
    }

    console.log("\n🎉 All characters have been imported to the database!");
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

importCharacters();
