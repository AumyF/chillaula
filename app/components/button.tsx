import { ButtonHTMLAttributes } from "react";

export const Button = (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`bg-teal-300 text-zinc-950 font-bold px-4 py-2 rounded-md disabled:bg-teal-200 disabled:text-zinc-600 ${props.className}`}
  ></button>
);
