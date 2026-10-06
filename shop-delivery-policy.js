export const MINIMUM_SHIPPING_ILS = 100;
export const isPickupOnly = product => !!product.pickupOnly || (product.categoryKeys || product.categories || [product.category]).includes('guitars');

export function deliveryState(lines, method = 'shipping') {
  const subtotalCents = lines.reduce((sum, line) => sum + Math.round(Number(line.price) * 100) * line.quantity, 0);
  const pickupOnly = lines.some(line => isPickupOnly(line.product));
  const deviceShipping = lines.some(line => (line.product.categoryKeys || line.product.categories || [line.product.category]).includes('smartphones') || line.product.sku?.startsWith('PELEPHONE-'));
  const shipping = method === 'shipping' && deviceShipping ? 50 : 0;
  const shortfall = Math.max(0, MINIMUM_SHIPPING_ILS * 100 - subtotalCents) / 100;
  return {subtotal: subtotalCents / 100, shipping, total: subtotalCents / 100 + shipping, shortfall, pickupOnly,
    allowed: lines.length > 0 && ['pickup', 'shipping'].includes(method) && (method === 'pickup' || (!pickupOnly && shortfall === 0))};
}

export function deliveryError(state, method, english = false) {
  if (!['pickup', 'shipping'].includes(method)) return english ? 'Choose delivery or store pickup.' : 'יש לבחור משלוח או איסוף עצמי';
  if (method === 'pickup') return '';
  if (state.pickupOnly) return english ? 'Your cart includes a pickup-only product. Choose store pickup.' : 'העגלה כוללת מוצר באיסוף עצמי בלבד. יש לבחור איסוף עצמי';
  if (state.shortfall > 0) return english ? 'For orders under ILS 100, please choose store pickup.' : 'בהזמנה מתחת ל-100 ₪ ניתן לבחור איסוף עצמי.';
  return '';
}
