import { decodeTime, ulid } from "ulidx";
import * as v from "valibot";
import * as User from "~/user/domain";
import { createdAtSchema } from "~/utils/domain";

export const AuthenticatorSchema = v.object({
  id: v.optional(v.number(), () => decodeTime(ulid())),
  createdAt: createdAtSchema,
  user: User.schema,
  credentialID: v.string(),
  credentialPublicKey: v.string(),
  counter: v.number(),
  credentialDeviceType: v.string(),
  credentialBackedUp: v.boolean(),
  transports: v.string(),
});

export type Authenticator = Readonly<v.Output<typeof AuthenticatorSchema>>;

type Input = v.Input<typeof AuthenticatorSchema>;

export const make = (
  input: Input,
): Authenticator => {
  return v.parse(AuthenticatorSchema, { ...input });
};

export interface IRepo {
  save(authenticator: Authenticator): Promise<void>
  queryManyByUser(user: User.User): Promise<Authenticator[]>;
  queryById(id: number): Promise<Authenticator>;
  queryByCredentialId(credentialId: string) : Promise<Authenticator>
}
