import { Loader2 } from 'lucide-react';

export function Spinner({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] text-blue-500 gap-3">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-gray-500 font-medium text-sm">{message}</span>
    </div>
  );
}
