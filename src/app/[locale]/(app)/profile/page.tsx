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

export default async function ProfilePage() {
  const profile = await getUserProfile();

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
            <ProfileForm
              initialDisplayName={profile.displayName || ""}
              initialAvatarHash={profile.avatarHash || "default"}
              email={profile.email}
              checkDisplayNameTakenAction={checkDisplayNameTakenAction}
            />
          </CardContent>
        </Card>
      </PageStack>
    </PageContainer>
  );
}
