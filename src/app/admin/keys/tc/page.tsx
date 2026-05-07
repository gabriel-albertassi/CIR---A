import KeyTableManager from '@/components/admin/KeyTableManager';
import { Zap } from 'lucide-react';

export const metadata = {
  title: 'Auditoria de TC | CIR-A',
};

export default function TCKeysPage() {
  return (
    <div className="p-8">
      <KeyTableManager 
        fixedType="TC" 
        title="Auditoria de Tomografias" 
        subtitle="Controle de chaves e autorizações de TC" 
        icon={Zap}
      />
    </div>
  );
}
