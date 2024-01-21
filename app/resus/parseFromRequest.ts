import { authenticator } from "~/auth.server";

export const parseResu = async (request: Request) => {
  const user = await authenticator.isAuthenticated(request);
  const formData = await request.formData();
  const content = formData.get("content")?.toString();
  if (!content) {
    return { _type: "error" as const, error: "content empty" };
  }
  if (!user) {
    return { _type: "error" as const, error: "login required" };
  }

  return { _type: "ok" as const, content, user };
};
