import { Kysely } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import type { DB } from "./db/generated/types";

export const db = new Kysely<DB>({
  dialect: new PlanetScaleDialect({
    url: process.env.DATABASE_URL,
  }),
});
