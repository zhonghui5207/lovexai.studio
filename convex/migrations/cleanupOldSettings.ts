import { mutation } from "../_generated/server";

// Migration to clean up old pov field from generation_settings
export const cleanupOldGenerationSettings = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.db.query("users").collect();
    
    let updated = 0;
    for (const user of users) {
      if (user.generation_settings) {
        // Check if settings has old fields
        const settings = user.generation_settings as any;
        
        if ('pov' in settings || 'intimacy' in settings) {
          // Create new settings without pov and intimacy
          const newSettings = {
            creativity: settings.creativity || "balanced",
            responseLength: settings.responseLength || "default",
            selectedModel: settings.selectedModel || "nova",
          };
          
          await ctx.db.patch(user._id, {
            generation_settings: newSettings,
          });
          
          updated++;
          console.log(`Cleaned up settings for user ${user._id}`);
        }
      }
    }
    
    return { message: `Cleaned up ${updated} users` };
  },
});
