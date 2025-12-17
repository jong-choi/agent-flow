import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export function DropdownTrigger({ userImage }: { userImage: string }) {
  return (
    <DropdownMenuTrigger asChild>
      <Avatar data-testid="user-menu-trigger">
        <AvatarImage src={userImage} alt="user-image" />
        <AvatarFallback>
          <Skeleton className="size-8 rounded-full" />
        </AvatarFallback>
      </Avatar>
    </DropdownMenuTrigger>
  );
}
