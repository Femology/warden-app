import type { VelocityWindow } from 'warden-sdk';

const SECONDS_PER_DAY = BigInt(86_400);
const ZERO = BigInt(0);
const SECONDS_PER_HOUR = BigInt(3_600);
const SECONDS_PER_MINUTE = BigInt(60);

interface VelocityGaugeProps {
  velocity: VelocityWindow;
  dailyVelocityCap: string;
}

function formatTimeRemaining(seconds: bigint): string {
  if (seconds <= ZERO) return 'resets now';
  const hours = seconds / SECONDS_PER_HOUR;
  const minutes = (seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE;
  if (hours > ZERO) return `${hours}h ${minutes}m until reset`;
  return `${minutes}m until reset`;
}

export function VelocityGauge({ velocity, dailyVelocityCap }: VelocityGaugeProps) {
  const cumulative = Number(velocity.cumulativeAmount);
  const cap = Number(dailyVelocityCap);
  const ratio = cap > 0 ? Math.min(cumulative / cap, 1) : 0;

  const now = BigInt(Math.floor(Date.now() / 1000));
  const resetAt = velocity.windowStart + SECONDS_PER_DAY;
  const remaining = resetAt > now ? resetAt - now : ZERO;

  const isNearCap = ratio >= 0.8;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="tabular-amount text-mist-100">
          {velocity.cumulativeAmount}{' '}
          <span className="text-mist-400">/ {dailyVelocityCap} today</span>
        </span>
        <span className="text-sm text-mist-400">{formatTimeRemaining(remaining)}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Daily spending against your limit"
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--color-ink-700)' }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${ratio * 100}%`,
            backgroundColor: isNearCap ? 'var(--color-gate)' : 'var(--color-clear)',
          }}
        />
      </div>
      <p className="text-sm text-mist-400">{velocity.txCount} transfer(s) in this window</p>
    </div>
  );
}
