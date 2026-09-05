import { clientProgramLabel } from './client-presentation';

describe('clientProgramLabel', () => {
  it('maps API enum names to the form labels', () => {
    expect(clientProgramLabel('PcaTraditional')).toBe('PCA Traditional');
    expect(clientProgramLabel('PcaChoice')).toBe('PCA Choice');
    expect(clientProgramLabel('Two45D')).toBe('245D');
    expect(clientProgramLabel('CfssAgency')).toBe('CFSS Agency');
    expect(clientProgramLabel('CfssBudget')).toBe('CFSS Budget');
  });
});
