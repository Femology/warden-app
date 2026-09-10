import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PolicyForm } from '@/components/PolicyForm';

const buildSetPolicy = vi.fn();
const submitSetPolicy = vi.fn();
const signWithPasskey = vi.fn();

vi.mock('@/lib/wardenClient', () => ({
  wardenClient: {
    buildSetPolicy: (...args: unknown[]) => buildSetPolicy(...args),
    submitSetPolicy: (...args: unknown[]) => submitSetPolicy(...args),
  },
}));

vi.mock('@/lib/passkeyWallet', () => ({
  signWithPasskey: (...args: unknown[]) => signWithPasskey(...args),
}));

describe('PolicyForm', () => {
  beforeEach(() => {
    buildSetPolicy.mockReset();
    submitSetPolicy.mockReset();
    signWithPasskey.mockReset();
  });

  it('disables submit and shows an error when the daily limit is below the no-confirmation amount', () => {
    render(<PolicyForm wallet="GTESTWALLET" />);

    fireEvent.change(screen.getByLabelText(/amount before step-up/i), {
      target: { value: '1000' },
    });
    fireEvent.change(screen.getByLabelText(/daily limit/i), {
      target: { value: '500' },
    });

    expect(
      screen.getByText(/daily limit can't be less than your no-confirmation amount/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set limits/i })).toBeDisabled();
    expect(buildSetPolicy).not.toHaveBeenCalled();
  });

  it('submits successfully with valid values', async () => {
    buildSetPolicy.mockResolvedValue({ xdr: 'unsigned-xdr' });
    signWithPasskey.mockResolvedValue('signed-xdr');
    submitSetPolicy.mockResolvedValue(undefined);

    render(<PolicyForm wallet="GTESTWALLET" />);

    fireEvent.change(screen.getByLabelText(/amount before step-up/i), {
      target: { value: '150' },
    });
    fireEvent.change(screen.getByLabelText(/daily limit/i), {
      target: { value: '500' },
    });
    fireEvent.click(screen.getByRole('button', { name: /set limits/i }));

    await waitFor(() => expect(screen.getByText(/limits set\./i)).toBeInTheDocument());

    expect(buildSetPolicy).toHaveBeenCalledWith(
      'GTESTWALLET',
      expect.objectContaining({ maxAmountNoStepUp: '150', dailyVelocityCap: '500' }),
      expect.any(String),
    );
    expect(signWithPasskey).toHaveBeenCalledWith('unsigned-xdr');
    expect(submitSetPolicy).toHaveBeenCalledWith('signed-xdr');
  });

  it('shows a distinct error state when submission fails', async () => {
    buildSetPolicy.mockRejectedValue(new Error('network unreachable'));

    render(<PolicyForm wallet="GTESTWALLET" />);
    fireEvent.click(screen.getByRole('button', { name: /set limits/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('network unreachable'));
  });
});
