import * as v from "valibot";
import { createdAtSchema, pkIdSchema } from "~/utils/domain";

export const domainSchema = v.object({
  id: pkIdSchema,
  createdAt : createdAtSchema,
  code: v.string(),
});

export type Invitation = v.Output<typeof domainSchema>;

export interface IInvitationRepo {
  query(code: string) : Promise<Invitation>
  isValid(invitation: Invitation): Promise<boolean>;
}
