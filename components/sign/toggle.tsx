"use client";

import SignIn from "./sign_in";
import User from "./user";
import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";

export default function SignToggle() {
  const t = useTranslations();
  const { user } = useAppContext();

  return (
    <div className="flex items-center">
      {user ? <User user={user} /> : <SignIn />}
    </div>
  );
}
