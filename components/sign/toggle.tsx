"use client";

import SignIn from "./sign_in";
import User from "./user";
import { useAppContext } from "@/contexts/app";
import { ReactNode } from "react";

interface SignToggleProps {
  children?: ReactNode;
  dropdownOpen?: boolean;
  onDropdownOpenChange?: (open: boolean) => void;
}

export default function SignToggle({ children, dropdownOpen, onDropdownOpenChange }: SignToggleProps) {
  const { user } = useAppContext();

  return (
    <div className="flex items-center w-full justify-center">
      {user ? (
        <User 
          user={user} 
          open={dropdownOpen} 
          onOpenChange={onDropdownOpenChange}
        >
          {children}
        </User>
      ) : (
        <SignIn />
      )}
    </div>
  );
}
