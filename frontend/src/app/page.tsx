import React from 'react';
import MobileShell from '@/components/MobileShell';
import QRScannerScreen from './components/QRScannerScreen';

export default function QRScannerPage() {
  return (
    <MobileShell>
      <QRScannerScreen />
    </MobileShell>
  );
}