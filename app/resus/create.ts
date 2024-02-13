import { UserRepo } from "~/user/infra";
import * as Domain from "./domain";
import { User } from "~/user/domain";
import { Thread } from "~/thread/domain";

export const createResu = async (
  repo: Domain.IResuRepo,
  input: Domain.ResuInput,
) => {
  const result = Domain.make(input);

  if (!result.success) {
    throw new Error(result.issues.map((issue) => issue.reason).toString());
  }
  const resu = result.output;

  await repo.save(resu);
};

export async function createResuOnThread(
  repo: Domain.IResuRepo,
  user: User,
  input: { content: string },
  thread: Thread,
) {
  if (user.id !== thread.author.id) {
    throw new Error("no permission on thread");
  }

  const result = Domain.make({
    content: input.content,
    authorId: user.id,
    threadId: thread.id,
  });

  if (!result.success) {
    throw new Error(result.issues.map((issue) => issue.reason).toString());
  }
  const resu = result.output;

  console.log(resu)
  await repo.save(resu);
}
