import app from "./app.js";
import { warmUpDatabase } from "./lib/prisma.js";

const PORT = Number(process.env.PORT ?? 5000);

// Warm up DB connection before accepting requests
warmUpDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
  });
});
