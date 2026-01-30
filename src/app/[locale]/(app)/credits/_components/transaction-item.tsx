import {
  ListCard,
  ListCardAmount,
  ListCardContent,
  ListCardDate,
  ListCardDescription,
  ListCardMeta,
  ListCardRow,
  ListCardTitle,
} from "@/components/list-card";
import { Badge } from "@/components/ui/badge";
import { type TransactionResult } from "@/db/query/credit";
import { formatYMD } from "@/lib/utils";

const TRANSACTION_TYPE_META = {
  earn: {
    label: "획득",
    badgeClass: "border border-chart-2/30 bg-chart-2/10 text-chart-2",
    amountClass: "text-chart-2",
  },
  spend: {
    label: "사용",
    badgeClass: "border border-chart-1/30 bg-chart-1/10 text-chart-1",
    amountClass: "text-chart-1",
  },
} as const;

export function TransactionItem({
  transaction,
}: {
  transaction: TransactionResult;
}) {
  const typeMeta = TRANSACTION_TYPE_META[transaction.type];

  return (
    <ListCard key={transaction.id}>
      <ListCardRow>
        <ListCardContent>
          <ListCardMeta>
            <Badge
              variant="outline"
              className={`${typeMeta.badgeClass} text-xs`}
            >
              {typeMeta.label}
            </Badge>

            <ListCardTitle>{transaction.title}</ListCardTitle>
          </ListCardMeta>
          {transaction.description && (
            <ListCardDescription>{transaction.description}</ListCardDescription>
          )}
          <ListCardDate>{formatYMD(transaction.occurredAt)}</ListCardDate>
        </ListCardContent>
        <ListCardAmount className={typeMeta.amountClass}>
          {`${transaction.amount > 0 ? "+" : ""}${transaction.amount.toLocaleString()}`}
        </ListCardAmount>
      </ListCardRow>
    </ListCard>
  );
}
