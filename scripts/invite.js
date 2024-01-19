import { Kysely } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";

/** @type {Kysely<import("../app/db/generated/types").DB>}*/
const db = new Kysely({
  dialect: new PlanetScaleDialect({
    url: process.env.DATABASE_URL,
  }),
});
const code = crypto.randomUUID();

await db.insertInto("Invitation").values({ code }).executeTakeFirstOrThrow();

console.log(code);
