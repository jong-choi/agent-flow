import { SignInCallback } from "@/types/next-auth";

export const signInCallback: SignInCallback = async ({ user, account }) => {
  console.log("signIn user:", user);
  console.log("signIn account:", account);
  return true;
};
