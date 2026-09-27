// report.tranzila.com/v1/transaction returns amount in minor units.
// Verified against transaction 482638: dashboard ILS 10.00, report amount 1000.
export function verifyReport(transaction: Record<string, unknown>, total: unknown, expectedIndex: string) {
  const totalText=String(total ?? '').trim();
  const parts=/^(\d+)(?:\.(\d{1,2}))?$/.exec(totalText);
  const expectedMinor=parts ? Number(parts[1])*100+Number((parts[2]||'').padEnd(2,'0')) : NaN;
  const amountText=String(transaction.amount ?? '').trim();
  const amountMinor=/^\d+$/.test(amountText) ? Number(amountText) : NaN;
  const amountMatches=Number.isSafeInteger(expectedMinor)&&expectedMinor>0&&Number.isSafeInteger(amountMinor)&&amountMinor===expectedMinor;
  const responseCode=String(transaction.processor_response_code ?? transaction.response_code ?? '');
  const currency=String(transaction.currency ?? transaction.currency_code ?? '');
  const reportedIndex=String(transaction.index ?? transaction.transaction_index ?? '');
  const indexMatches=/^\d+$/.test(expectedIndex)&&reportedIndex===expectedIndex;
  const currencyMatches=currency==='1'||currency.toUpperCase()==='ILS';
  const chargeMatches=transaction.tranmode==='A'&&transaction.txn_type==='DEBIT'&&!transaction.cancelfdid;
  return {approved:responseCode==='000'&&amountMatches&&currencyMatches&&indexMatches&&chargeMatches,responseCode,currency,reportedIndex,amountMinor,expectedMinor,amountMatches,currencyMatches,indexMatches,chargeMatches};
}
