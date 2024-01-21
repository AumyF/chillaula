import { FC, PropsWithChildren } from "react";

export const PageHeading: FC<PropsWithChildren> = ({ children }) => {
  return <h1 className="font-bold text-3xl break-words">{children}</h1>;
};
