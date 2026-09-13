import type { Metadata } from 'next';
import HowItWorksClient from './HowItWorksClient';

export const metadata: Metadata = {
  title: 'How Warden Works - Simple On-Chain Smart Wallet Security',
  description:
    'Learn how Warden protects your digital money with smart spending rules. Zero friction on daily coffee runs, instant lock-down when unusual drains occur.',
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
