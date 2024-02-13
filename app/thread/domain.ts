import * as v from "valibot";
import * as User from "~/user/domain";
import { createdAtSchema, pkIdSchema } from "~/utils/domain";

export const ThreadSchema = v.object({
  id: pkIdSchema,
  createdAt: createdAtSchema,
  author: User.schema,
  title: v.string(),
});

export type Thread = v.Output<typeof ThreadSchema>;

export const makeThread = (
  input: Omit<v.Input<typeof ThreadSchema>, "id" | "createdAt">,
) => v.parse(ThreadSchema, input);

export interface IThreadRepo {
  save(thread: Thread): Promise<void>;
  queryById(id: number): Promise<Thread>;
}
