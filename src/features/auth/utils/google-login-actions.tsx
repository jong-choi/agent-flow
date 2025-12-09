import { signIn } from "@/lib/auth";

export const continueWithGoogle = async () => {
  "use server";

  await signIn("google", { redirectTo: "/" });
};
