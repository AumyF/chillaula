import { Temporal } from "@js-temporal/polyfill";
import { decodeTime, ulid } from "ulidx";
import * as v from "valibot";

type Thread = { id: number };

export const resuSchema = v.object({
  id: v.optional(v.number(), () => decodeTime(ulid())),
  createdAt: v.optional(v.instance(Temporal.Instant), () =>
    Temporal.Now.instant(),
  ),
  content: v.string(),
  authorId: v.number(),
  threadId: v.optional(v.number()),
});

export type ResuInput = v.Input<typeof resuSchema>;
export type Resu = Readonly<v.Output<typeof resuSchema>>;

export const make = (
  input: ResuInput,
): v.SafeParseResult<typeof resuSchema> => {
  return v.safeParse(resuSchema, input);
};

export const attachThread = (resu: Resu, thread: Thread): Resu => {
  return {
    ...resu,
    threadId: thread.id,
  };
};

export interface IResuRepo {
  save(resu: Resu): Promise<void>;
  fetchLatest(): Promise<Resu[]>;
  fetchLatestOnThread(thread: Thread): Promise<Resu[]>;
}
