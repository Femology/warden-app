import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrustedRecipientsList } from '@/components/TrustedRecipientsList';

const buildAddTrustedRecipient = vi.fn();
const submitAddTrustedRecipient = vi.fn();
const buildRemoveTrustedRecipient = vi.fn();
const submitRemoveTrustedRecipient = vi.fn();
const signWithPasskey = vi.fn();

vi.mock('@/lib/wardenClient', () => ({
  wardenClient: {
    buildAddTrustedRecipient: (...args: unknown[]) => buildAddTrustedRecipient(...args),
    submitAddTrustedRecipient: (...args: unknown[]) => submitAddTrustedRecipient(...args),
    buildRemoveTrustedRecipient: (...args: unknown[]) => buildRemoveTrustedRecipient(...args),
    submitRemoveTrustedRecipient: (...args: unknown[]) => submitRemoveTrustedRecipient(...args),
  },
}));

vi.mock('@/lib/passkeyWallet', () => ({
  signWithPasskey: (...args: unknown[]) => signWithPasskey(...args),
}));

describe('TrustedRecipientsList', () => {
  beforeEach(() => {
    buildAddTrustedRecipient.mockReset();
    submitAddTrustedRecipient.mockReset();
    buildRemoveTrustedRecipient.mockReset();
    submitRemoveTrustedRecipient.mockReset();
    signWithPasskey.mockReset();
  });

  it('adds a recipient successfully', async () => {
    buildAddTrustedRecipient.mockResolvedValue({ xdr: 'unsigned' });
    signWithPasskey.mockResolvedValue('signed');
    submitAddTrustedRecipient.mockResolvedValue(undefined);
    const onChanged = vi.fn();

    render(<TrustedRecipientsList wallet="GWALLET" recipients={[]} onChanged={onChanged} />);

    fireEvent.change(screen.getByLabelText(/new trusted recipient address/i), {
      target: { value: 'GRECIPIENT' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(buildAddTrustedRecipient).toHaveBeenCalledWith('GWALLET', 'GRECIPIENT', expect.any(String));
    expect(submitAddTrustedRecipient).toHaveBeenCalledWith('signed');
  });

  it('shows an error state when adding fails', async () => {
    buildAddTrustedRecipient.mockRejectedValue(new Error('already trusted'));

    render(<TrustedRecipientsList wallet="GWALLET" recipients={[]} />);
    fireEvent.change(screen.getByLabelText(/new trusted recipient address/i), {
      target: { value: 'GRECIPIENT' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('already trusted'));
  });

  it('removes an existing recipient successfully', async () => {
    buildRemoveTrustedRecipient.mockResolvedValue({ xdr: 'unsigned' });
    signWithPasskey.mockResolvedValue('signed');
    submitRemoveTrustedRecipient.mockResolvedValue(undefined);
    const onChanged = vi.fn();

    render(
      <TrustedRecipientsList wallet="GWALLET" recipients={['GRECIPIENTONE']} onChanged={onChanged} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(buildRemoveTrustedRecipient).toHaveBeenCalledWith(
      'GWALLET',
      'GRECIPIENTONE',
      expect.any(String),
    );
  });

  it('shows an error state when removing fails', async () => {
    buildRemoveTrustedRecipient.mockRejectedValue(new Error('not trusted'));

    render(<TrustedRecipientsList wallet="GWALLET" recipients={['GRECIPIENTONE']} />);
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('not trusted'));
  });
});
