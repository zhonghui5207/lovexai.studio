import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for expired subscriptions daily at midnight UTC
crons.daily(
  "check expired subscriptions",
  { hourUTC: 0, minuteUTC: 0 },
  internal.subscriptions.checkExpiredSubscriptions
);

// Reset daily swipe counters at midnight UTC (optional - already handled on demand)
// crons.daily(
//   "reset daily swipes",
//   { hourUTC: 0, minuteUTC: 0 },
//   internal.subscriptions.resetDailyCounters
// );

export default crons;
