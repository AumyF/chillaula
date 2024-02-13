import { Temporal } from "@js-temporal/polyfill";
import { decodeTime, ulid } from "ulidx";
import * as v from "valibot";

export const pkIdSchema = v.optional(v.number(), () => decodeTime(ulid()));
export const createdAtSchema = v.optional(v.instance(Temporal.Instant), () =>
  Temporal.Now.instant(),
);
