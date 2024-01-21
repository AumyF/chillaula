import { Kysely } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import type { DB } from "./db/generated/types";

export const connect = (url: string) =>
  new Kysely<DB>({
    dialect: new PlanetScaleDialect({
      url,
      fetch: (url, init) => {
        delete init?.["cache"];
        return fetch(url, init);
      },
    }),
  });
