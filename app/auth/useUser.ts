import { useRouteLoaderData } from "@remix-run/react";
import { type loader } from "~/root";

export const useUser = () => {
  const a = useRouteLoaderData<typeof loader>("root");
  return a?.user;
};
