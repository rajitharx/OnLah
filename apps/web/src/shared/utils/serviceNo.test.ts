import { describe, expect, it } from 'vitest';
import { sortByServiceNo } from './serviceNo';

describe('sortByServiceNo', () => {
  it('sorts service numbers by their number, not as text', () => {
    const services = ['130', '12', '2', '32', '7', '80'].map((serviceNo) => ({ serviceNo }));
    expect(sortByServiceNo(services).map((s) => s.serviceNo)).toEqual(['2', '7', '12', '32', '80', '130']);
  });

  it('keeps a suffix after its number, and orders suffixes after the bare number', () => {
    const services = ['961M', '10e', '10', '9'].map((serviceNo) => ({ serviceNo }));
    expect(sortByServiceNo(services).map((s) => s.serviceNo)).toEqual(['9', '10', '10e', '961M']);
  });

  it('does not change the order of the input', () => {
    const services = [{ serviceNo: '12' }, { serviceNo: '2' }];
    sortByServiceNo(services);
    expect(services.map((s) => s.serviceNo)).toEqual(['12', '2']);
  });
});
