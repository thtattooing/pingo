"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TransactionList, { type Transaction } from "./TransactionList";
import EditTransactionModal from "./EditTransactionModal";

export default function HomeTransactionSection({
  transactions,
  userId,
}: {
  transactions: Transaction[];
  userId: string;
}) {
  const router = useRouter();
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  return (
    <>
      <TransactionList
        transactions={transactions}
        onEdit={setEditTx}
      />
      {editTx && (
        <EditTransactionModal
          tx={editTx}
          userId={userId}
          onClose={() => setEditTx(null)}
          onSaved={() => { setEditTx(null); router.refresh(); }}
        />
      )}
    </>
  );
}
