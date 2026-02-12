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
import { type TransactionResult } from "@/features/credits/server/queries";
import { formatYMD } from "@/lib/utils";

const TRANSACTION_TYPE_STYLE_META = {
  earn: {
    badgeClass: "border border-chart-2/30 bg-chart-2/10 text-chart-2",
    amountClass: "text-chart-2",
  },
  spend: {
    badgeClass: "border border-chart-1/30 bg-chart-1/10 text-chart-1",
    amountClass: "text-chart-1",
  },
} as const;

export function TransactionItem({
  transaction,
  typeLabels,
}: {
  transaction: TransactionResult;
  typeLabels: {
    earn: string;
    spend: string;
  };
}) {
  const typeMeta = TRANSACTION_TYPE_STYLE_META[transaction.type];
  const typeLabel = typeLabels[transaction.type];

  return (
    <ListCard key={transaction.id}>
      <ListCardRow>
        <ListCardContent>
          <ListCardMeta>
            <Badge
              variant="outline"
              className={`${typeMeta.badgeClass} text-xs`}
            >
              {typeLabel}
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
