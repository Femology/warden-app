import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrustedRecipientsList } from '@/components/TrustedRecipientsList';

const buildAddTrustedRecipient = vi.fn();
const submitAddTrustedRecipient = vi.fn();
const buildRemoveTrustedRecipient = vi.fn();
const submitRemoveTrustedRecipient = vi.fn();
const signXdr = vi.fn();

vi.mock('@/lib/wardenClient', () => ({
  wardenClient: {
    buildAddTrustedRecipient: (...args: unknown[]) => buildAddTrustedRecipient(...args),
    submitAddTrustedRecipient: (...args: unknown[]) => submitAddTrustedRecipient(...args),
    buildRemoveTrustedRecipient: (...args: unknown[]) => buildRemoveTrustedRecipient(...args),
    submitRemoveTrustedRecipient: (...args: unknown[]) => submitRemoveTrustedRecipient(...args),
  },
}));

vi.mock('@/lib/wallet', () => ({
  signXdr: (...args: unknown[]) => signXdr(...args),
  sourceAccountOverride: () => undefined,
}));

describe('TrustedRecipientsList', () => {
  beforeEach(() => {
    buildAddTrustedRecipient.mockReset();
    submitAddTrustedRecipient.mockReset();
    buildRemoveTrustedRecipient.mockReset();
    submitRemoveTrustedRecipient.mockReset();
    signXdr.mockReset();
  });

  it('adds a recipient successfully', async () => {
    buildAddTrustedRecipient.mockResolvedValue({ xdr: 'unsigned' });
    signXdr.mockResolvedValue('signed');
    submitAddTrustedRecipient.mockResolvedValue(undefined);
    const onChanged = vi.fn();

    render(
      <TrustedRecipientsList
        wallet="GWALLET"
        recipients={{}}
        trustDecaySeconds={BigInt(2_592_000)}
        onChanged={onChanged}
      />,
    );

    fireEvent.change(screen.getByLabelText(/new trusted recipient address/i), {
      target: { value: 'GRECIPIENT' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(buildAddTrustedRecipient).toHaveBeenCalledWith('GWALLET', 'GRECIPIENT', undefined);
    expect(submitAddTrustedRecipient).toHaveBeenCalledWith('signed');
  });

  it('shows an error state when adding fails', async () => {
    buildAddTrustedRecipient.mockRejectedValue(new Error('already trusted'));

    render(<TrustedRecipientsList wallet="GWALLET" recipients={{}} trustDecaySeconds={BigInt(2_592_000)} />);
    fireEvent.change(screen.getByLabelText(/new trusted recipient address/i), {
      target: { value: 'GRECIPIENT' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('already trusted'));
  });

  it('removes an existing recipient successfully', async () => {
    buildRemoveTrustedRecipient.mockResolvedValue({ xdr: 'unsigned' });
    signXdr.mockResolvedValue('signed');
    submitRemoveTrustedRecipient.mockResolvedValue(undefined);
    const onChanged = vi.fn();

    render(
      <TrustedRecipientsList
        wallet="GWALLET"
        recipients={{ GRECIPIENTONE: BigInt(1_700_000_000) }}
        trustDecaySeconds={BigInt(2_592_000)}
        onChanged={onChanged}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(buildRemoveTrustedRecipient).toHaveBeenCalledWith(
      'GWALLET',
      'GRECIPIENTONE',
      undefined,
    );
  });

  it('shows an error state when removing fails', async () => {
    buildRemoveTrustedRecipient.mockRejectedValue(new Error('not trusted'));

    render(
      <TrustedRecipientsList
        wallet="GWALLET"
        recipients={{ GRECIPIENTONE: BigInt(1_700_000_000) }}
        trustDecaySeconds={BigInt(2_592_000)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('not trusted'));
  });
});
