import { ButtonHTMLAttributes } from "react";

export const Button = (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`bg-blue-600 text-zinc-50 font-bold px-4 py-2 rounded-lg disabled:bg-teal-200 disabled:text-zinc-600 ${props.className}`}
  ></button>
);
