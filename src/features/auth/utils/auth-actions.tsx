"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { TEST_PASSWORD, signIn, signOut } from "@/lib/auth";

export const signInWithGoogleAction = async (formData: FormData) => {
  const rawCallbackUrl = formData.get("callbackUrl");
  const callbackUrl = typeof rawCallbackUrl === "string" ? rawCallbackUrl : "";
  const redirectTo =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("/login")
      ? callbackUrl
      : "/";

  await signIn("google", { redirectTo });
};

export const signOutAction = async () => {
  await signOut({ redirectTo: "/" });
};

export const devPasswordSignIn = async (formData: FormData) => {
  const DEV_SIGNIN_ERROR_URL = "/login?error=dev-password";
  formData.append("redirectTo", "/");

  try {
    await signIn(TEST_PASSWORD, formData);
  } catch (error) {
    if (error instanceof AuthError) {
      return redirect(`${DEV_SIGNIN_ERROR_URL}&code=${error.type}`);
    }
    throw error;
  }
};
