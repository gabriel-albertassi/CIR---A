import KeyTableManager from '@/components/admin/KeyTableManager';
import { Fingerprint } from 'lucide-react';

export const metadata = {
  title: 'Auditoria de RNM | CIR-A',
};

export const dynamic = 'force-dynamic';

export default function RNMKeysPage() {
  return (
    <div className="p-8">
      <KeyTableManager 
        fixedType="RNM" 
        title="Auditoria de Ressonâncias" 
        subtitle="Controle de chaves e autorizações de RNM" 
      />
    </div>
  );
}

