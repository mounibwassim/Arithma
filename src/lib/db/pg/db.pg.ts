// import { Logger } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "./schema.pg";

// class MyLogger implements Logger {
//   logQuery(query: string, params: unknown[]): void {
//     console.log({ query, params });
//   }
// }
export const pgDb = drizzlePg(process.env.POSTGRES_URL!, {
  schema,
  //   logger: new MyLogger(),
});
