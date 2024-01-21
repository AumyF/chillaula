/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

import { Kysely } from "kysely";
import { DB } from "~/db/generated/types";

declare module "@remix-run/server-runtime" {
  interface AppLoadContext {
    db: Kysely<DB>;
  }
}
