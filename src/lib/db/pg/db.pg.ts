// import { Logger } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "./schema.pg";

// class MyLogger implements Logger {
//   logQuery(query: string, params: unknown[]): void {
//     console.log({ query, params });
//   }
// }

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const pgDb = drizzlePg(connectionString!, {
  schema,
  //   logger: new MyLogger(),
});
