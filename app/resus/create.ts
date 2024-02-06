import * as Domain from "./domain";

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
