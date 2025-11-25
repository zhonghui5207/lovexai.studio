"use client";

import SignIn from "./sign_in";
import User from "./user";
import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";

import { ReactNode } from "react";

export default function SignToggle({ children }: { children?: ReactNode }) {
  const t = useTranslations();
  const { user } = useAppContext();

  return (
    <div className="flex items-center w-full justify-center">
      {user ? <User user={user}>{children}</User> : <SignIn />}
    </div>
  );
}
