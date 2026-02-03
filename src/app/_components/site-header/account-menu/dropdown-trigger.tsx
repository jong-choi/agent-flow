import { BoringUserAvatar } from "@/components/boring-avatar";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function DropdownTrigger({ userId }: { userId: string }) {
  return (
    <DropdownMenuTrigger asChild>
      <div className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-full">
        <BoringUserAvatar seed={userId} className="size-8" />
      </div>
    </DropdownMenuTrigger>
  );
}
