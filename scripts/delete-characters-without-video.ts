/**
 * Delete characters without video_url from Convex database
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

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const client = new ConvexHttpClient(convexUrl!);

async function deleteCharactersWithoutVideo() {
  console.log("🔍 Fetching characters from database...\n");

  const characters = await client.query(api.characters.list, {});

  const toDelete = characters.filter((char: any) => !char.video_url);
  const toKeep = characters.filter((char: any) => char.video_url);

  console.log(`📊 Total characters: ${characters.length}`);
  console.log(`✅ Characters with video_url: ${toKeep.length}`);
  console.log(`❌ Characters without video_url: ${toDelete.length}\n`);

  if (toDelete.length === 0) {
    console.log("✨ No characters to delete!");
    return;
  }

  console.log("🗑️ Characters to delete:");
  for (const char of toDelete) {
    console.log(`   - ${char.name} (${char.username})`);
  }

  console.log("\n⏳ Deleting characters...\n");

  for (const char of toDelete) {
    try {
      // Use internal mutation to force delete (bypassing creator check)
      await client.mutation(api.characters.forceDelete, { id: char._id });
      console.log(`   ✅ Deleted: ${char.name}`);
    } catch (error: any) {
      console.log(`   ❌ Failed to delete ${char.name}: ${error.message}`);
    }
  }

  console.log("\n🎉 Cleanup completed!");
}

deleteCharactersWithoutVideo();
