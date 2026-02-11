import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  PageContainer,
  PageHeader,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { checkDisplayNameTakenAction } from "@/features/profile/server/actions";
import { getUserProfile } from "@/features/profile/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/profile">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Profile",
  });

  return {
    title: t("meta.profileTitle"),
  };
}

export default async function ProfilePage({
  params,
}: PageProps<"/[locale]/profile">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Profile",
  });

  return (
    <PageContainer>
      <PageStack>
        <PageHeader>
          <PageHeading>{t("page.heading")}</PageHeading>
        </PageHeader>
        <Card>
          <CardHeader>
            <CardTitle>{t("page.basicInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Suspense fallback={<ProfileCardContentFallback />}>
              <ProfileCardContent />
            </Suspense>
          </CardContent>
        </Card>
      </PageStack>
    </PageContainer>
  );
}

async function ProfileCardContent() {
  const profile = await getUserProfile();

  return (
    <ProfileForm
      initialDisplayName={profile.displayName || ""}
      initialAvatarHash={profile.avatarHash || "default"}
      email={profile.email}
      checkDisplayNameTakenAction={checkDisplayNameTakenAction}
    />
  );
}

function ProfileCardContentFallback() {
  return (
    <div className="space-y-6">
      <div className="h-20 w-full animate-pulse rounded bg-muted/70" />
      <div className="h-10 w-full animate-pulse rounded bg-muted/70" />
      <div className="h-9 w-24 animate-pulse rounded bg-muted/70" />
    </div>
  );
}
