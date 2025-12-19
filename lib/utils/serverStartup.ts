/**
 * Server Startup Handler
 * This script is called when the Next.js server starts
 * It handles cleanup and recovery of incomplete jobs
 */

const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;

export async function handleServerStartup() {
  try {
    console.log("🚀 Server startup - checking for incomplete jobs...");

    // Wait a bit for the server to fully initialize
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Call the restart endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/jobs/restart`, {
      method: "POST",
      headers: {
        "x-service-key": INTERNAL_SERVICE_KEY || "",
      },
  });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Job cleanup completed: ${data.message}`);
    } else {
      console.error("❌ Job cleanup failed:", await response.text());
    }
  } catch (error) {
    console.error("❌ Error during server startup job cleanup:", error);
  }
}

// Auto-run on import if we're in server context
if (typeof window === "undefined") {
  // Only run in production or if explicitly enabled
//   if (process.env.NODE_ENV === "production" || process.env.ENABLE_JOB_RESTART === "true") {
    handleServerStartup().catch(console.error);
//   }
}
