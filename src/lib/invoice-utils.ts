export function calculateInvoiceTotals(subtotal: number, vatRate: number) {
  const vatAmount = subtotal * (vatRate / 100);
  const totalAmount = subtotal + vatAmount;

  return { vatAmount, totalAmount };
}
