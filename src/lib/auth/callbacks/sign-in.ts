import { AuthCallbacks } from "@/lib/auth/types/next-auth";

export const signInCallback: AuthCallbacks["signIn"] = async ({
  user,
  account,
}) => {
  console.log("signIn user:", user);
  console.log("signIn account:", account);
  return true;
};
