import type { ReactNode } from "react";
import { CreditHistoryFilter } from "@/app/[locale]/(app)/credits/history/_components/history-filter";

type CreditsHistoryLayoutProps = {
  children: ReactNode;
};

export default function CreditsHistoryLayout({
  children,
}: CreditsHistoryLayoutProps) {
  return (
    <>
      {children}
      <aside className="fixed top-20 right-10 w-full shrink-0 lg:w-72">
        <CreditHistoryFilter />
      </aside>
    </>
  );
}
