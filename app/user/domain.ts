import * as v from "valibot";
import { createdAtSchema, pkIdSchema } from "~/utils/domain";

export const schema = v.object({
  id: pkIdSchema,
  createdAt: createdAtSchema,
  username: v.string(),
  invitationId: v.number()
});

export type User = Readonly<v.Output<typeof schema>>;

type Input = v.Input<typeof schema>;

export const make = (input: Input): User => {
  return v.parse(schema, input);
};

export interface IUserRepo {
  save(user: User): Promise<void>;
  queryByUsername(username: string): Promise<User>;
  queryById(id: number): Promise<User>;
}
