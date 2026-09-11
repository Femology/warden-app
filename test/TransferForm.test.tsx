import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransferForm } from '@/components/TransferForm';

const buildEvaluate = vi.fn();
const submitEvaluate = vi.fn();
const signXdr = vi.fn();
const signXdrFor = vi.fn();
const buildTransfer = vi.fn();
const submitTransfer = vi.fn();

vi.mock('@/lib/wardenClient', () => ({
  wardenClient: {
    buildEvaluate: (...args: unknown[]) => buildEvaluate(...args),
    submitEvaluate: (...args: unknown[]) => submitEvaluate(...args),
  },
}));

vi.mock('@/lib/wallet', () => ({
  signXdr: (...args: unknown[]) => signXdr(...args),
  signXdrFor: (...args: unknown[]) => signXdrFor(...args),
  sourceAccountOverride: () => undefined,
}));

vi.mock('@/lib/tokenClient', () => ({
  buildTransfer: (...args: unknown[]) => buildTransfer(...args),
  submitTransfer: (...args: unknown[]) => submitTransfer(...args),
  tokenAssembledFromXdr: vi.fn(),
}));

function fillForm() {
  fireEvent.change(screen.getByLabelText(/recipient/i), { target: { value: 'GRECIPIENT' } });
  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '100' } });
}

describe('TransferForm', () => {
  beforeEach(() => {
    buildEvaluate.mockReset();
    submitEvaluate.mockReset();
    signXdr.mockReset();
    signXdrFor.mockReset();
    buildTransfer.mockReset();
    submitTransfer.mockReset();
  });

  it('executes payment directly on an Allow decision, with no modal', async () => {
    buildEvaluate.mockResolvedValue({ xdr: 'unsigned-eval' });
    signXdr.mockResolvedValue('signed-eval');
    submitEvaluate.mockResolvedValue({ type: 'Allow' });
    buildTransfer.mockResolvedValue({ xdr: 'unsigned-pay' });
    signXdrFor.mockResolvedValue('signed-pay');
    submitTransfer.mockResolvedValue('deadbeef');

    render(<TransferForm wallet="GWALLET" />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(screen.getByText(/sent\./i)).toBeInTheDocument());

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(buildTransfer).toHaveBeenCalledWith('GWALLET', 'GRECIPIENT', '100');
    expect(submitTransfer).toHaveBeenCalledWith('signed-pay');
  });

  it('shows the step-up modal on RequireStepUp and pays only after confirm', async () => {
    buildEvaluate.mockResolvedValue({ xdr: 'unsigned-eval' });
    signXdr.mockResolvedValue('signed-eval');
    submitEvaluate.mockResolvedValue({ type: 'RequireStepUp', reason: 'AmountExceeded' });
    buildTransfer.mockResolvedValue({ xdr: 'unsigned-pay' });
    signXdrFor.mockResolvedValue('signed-pay');
    submitTransfer.mockResolvedValue('deadbeef');

    render(<TransferForm wallet="GWALLET" />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/above your no-confirmation limit/i);
    expect(buildTransfer).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /confirm and send/i }));

    await waitFor(() => expect(screen.getByText(/sent\./i)).toBeInTheDocument());
    expect(buildTransfer).toHaveBeenCalledTimes(1);
  });

  it('fully aborts on cancel -- no payment, no partial state', async () => {
    buildEvaluate.mockResolvedValue({ xdr: 'unsigned-eval' });
    signXdr.mockResolvedValue('signed-eval');
    submitEvaluate.mockResolvedValue({ type: 'RequireStepUp', reason: 'NewRecipient' });

    render(<TransferForm wallet="GWALLET" />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(buildTransfer).not.toHaveBeenCalled();
    expect(submitTransfer).not.toHaveBeenCalled();
    expect(screen.queryByText(/sent\./i)).not.toBeInTheDocument();
  });

  it('dismisses the step-up modal on Escape, aborting the same way as Cancel', async () => {
    buildEvaluate.mockResolvedValue({ xdr: 'unsigned-eval' });
    signXdr.mockResolvedValue('signed-eval');
    submitEvaluate.mockResolvedValue({ type: 'RequireStepUp', reason: 'VelocityExceeded' });

    render(<TransferForm wallet="GWALLET" />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await screen.findByRole('dialog');
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(buildTransfer).not.toHaveBeenCalled();
  });
});
