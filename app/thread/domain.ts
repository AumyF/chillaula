import * as v from "valibot";
import * as User from "~/user/domain";
import { createdAtSchema, pkIdSchema } from "~/utils/domain";

export const ThreadSchema = v.object({
  id: pkIdSchema,
  createdAt: createdAtSchema,
  author: User.schema,
  title: v.string(),
  isPrivate: v.optional(v.boolean(), () => true),
  isClosed: v.optional(v.boolean(), () => false),
});

export type Thread = Readonly<v.Output<typeof ThreadSchema>>;

export const makeThread = (
  input: Omit<v.Input<typeof ThreadSchema>, "id" | "createdAt">,
) => v.parse(ThreadSchema, input);

export const makePrivate = (input: Thread): Thread => {
  return {
    ...input,
    isPrivate: true,
  };
};
export const makePublic = (input: Thread): Thread => {
  return {
    ...input,
    isPrivate: false,
  };
};

export interface IThreadRepo {
  save(thread: Thread): Promise<void>;
  queryById(id: number): Promise<Thread>;
}
