import { IInvitationRepo } from "~/invitation/domain";
import { IUserRepo, make } from "./domain";

export async function signup(
  userRepo: IUserRepo,
  invitationRepo: IInvitationRepo,
  {
    username,
    code,
  }: {
    username: string;
    code: string;
  },
) {
  const invitation = await invitationRepo.query(code);
  if (!invitation) {
    throw new Error("Invitation code invalid");
  }

  // invite codeが未使用かチェック

  if (!(await invitationRepo.isValid(invitation))) {
    throw new Error("Invitation code already used");
  }

  const user = make({ username, invitationId: invitation.id });

  await userRepo.save(user);
}
