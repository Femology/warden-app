import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VelocityGauge } from '@/components/VelocityGauge';
import type { VelocityWindow } from 'warden-sdk';

describe('VelocityGauge', () => {
  it('reflects cumulative amount against the daily cap', () => {
    const velocity: VelocityWindow = {
      windowStart: BigInt(Math.floor(Date.now() / 1000)),
      cumulativeAmount: '300',
      txCount: 2,
    };

    render(<VelocityGauge velocity={velocity} dailyVelocityCap="500" />);

    expect(screen.getByText(/300/)).toBeInTheDocument();
    expect(screen.getByText(/500 today/)).toBeInTheDocument();
    expect(screen.getByText(/2 transfer\(s\) in this window/i)).toBeInTheDocument();

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '60');
  });

  it('shows time remaining until the window resets, correctly derived from windowStart', () => {
    const oneHourAgo = BigInt(Math.floor(Date.now() / 1000) - 3_600);
    const velocity: VelocityWindow = {
      windowStart: oneHourAgo,
      cumulativeAmount: '0',
      txCount: 0,
    };

    render(<VelocityGauge velocity={velocity} dailyVelocityCap="500" />);

    // 24h window, 1h elapsed -> ~23h remaining.
    expect(screen.getByText(/23h/)).toBeInTheDocument();
  });

  it('shows "resets now" once the window has fully elapsed', () => {
    const twoDaysAgo = BigInt(Math.floor(Date.now() / 1000) - 2 * 86_400);
    const velocity: VelocityWindow = {
      windowStart: twoDaysAgo,
      cumulativeAmount: '0',
      txCount: 0,
    };

    render(<VelocityGauge velocity={velocity} dailyVelocityCap="500" />);
    expect(screen.getByText(/resets now/i)).toBeInTheDocument();
  });
});
