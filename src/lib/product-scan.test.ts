import { describe, expect, it } from 'vitest';
import { getProductScanQuery } from './product-scan';

describe('getProductScanQuery', () => {
  it('prefers the scanned barcode when present', () => {
    expect(
      getProductScanQuery({ barcode: '123456', nom: 'Gamma', sku: 'SKU-1' }),
    ).toBe('123456');
  });

  it('falls back to the product name when there is no barcode', () => {
    expect(getProductScanQuery({ nom: 'Produit test', sku: 'SKU-1' })).toBe(
      'Produit test',
    );
  });

  it('returns an empty string for a blank product', () => {
    expect(getProductScanQuery(null)).toBe('');
  });
});
