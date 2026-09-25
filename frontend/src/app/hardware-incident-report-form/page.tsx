import React from 'react';
import MobileShell from '@/components/MobileShell';
import IncidentReportScreen from './components/IncidentReportScreen';

export default function HardwareIncidentReportPage() {
  return (
    <MobileShell>
      <IncidentReportScreen />
    </MobileShell>
  );
}