/**
 * Check character data in Convex database
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

async function checkCharacters() {
  console.log("🔍 Fetching characters from database...\n");

  const characters = await client.query(api.characters.list, {});

  for (const char of characters) {
    console.log(`📌 ${char.name} (${char.username})`);
    console.log(`   category: ${char.category || "❌ missing"}`);
    console.log(`   video_url: ${char.video_url || "❌ missing"}`);
    console.log(`   avatar_url: ${char.avatar_url || "❌ missing"}`);
    console.log("");
  }
}

checkCharacters();
