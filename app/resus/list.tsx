import { FC, PropsWithChildren } from "react";

export const ResuList: FC<PropsWithChildren> = ({ children }) => {
  return <ul className="flex flex-col gap-2">{children}</ul>;
};
