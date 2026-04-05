import { execSync } from "child_process";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runMigrations() {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      console.log(`Attempt ${i} of ${MAX_RETRIES}: Running prisma migrate deploy...`);
      execSync("npx prisma migrate deploy --schema prisma/schema.prisma", {
        stdio: "inherit",
      });
      console.log("Prisma migrations applied successfully!");
      return;
    } catch (error) {
      if (i === MAX_RETRIES) {
        console.error(`Failed to apply migrations after ${MAX_RETRIES} attempts.`);
        process.exit(1);
      }
      console.log(`Migration failed. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function main() {
  await runMigrations();
  console.log("Starting server...");
  execSync("npm run start", { stdio: "inherit" });
}

main();
