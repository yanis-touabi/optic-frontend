export type ProductScanCandidate = {
  barcode?: string | null;
  sku?: string | null;
  nom?: string | null;
  name?: string | null;
};

export function getProductScanQuery(
  product: ProductScanCandidate | null | undefined,
) {
  if (!product) return '';

  const barcode = (product.barcode ?? '').trim();
  if (barcode) return barcode;

  const name = (product.nom ?? product.name ?? '').trim();
  if (name) return name;

  const sku = (product.sku ?? '').trim();
  if (sku) return sku;

  return '';
}
