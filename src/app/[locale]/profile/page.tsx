import { Suspense } from "react";
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

export default function ProfilePage() {
  return (
    <PageContainer>
      <PageStack>
        <PageHeader>
          <PageHeading>프로필 설정</PageHeading>
        </PageHeader>
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
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
