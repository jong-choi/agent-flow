import { ProfileForm } from "@/app/[locale]/(app)/profile/_components/profile-form";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import {
  Card,
  CardContent,
  CardDescription as CardDescriptionText,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserProfile } from "@/db/query/auth";

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
            />
          </CardContent>
        </Card>
      </PageStack>
    </PageContainer>
  );
}
