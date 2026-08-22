import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  message?: string;
  progress?: number;
  details?: string;
}

export function Spinner({ message = "Carregando...", progress, details }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] text-blue-500 gap-3 p-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <span className="text-gray-700 font-medium text-sm text-center">{message}</span>
      
      {progress != null && (
        <div className="w-full max-w-xs space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-200 ease-out" 
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{Math.round(progress)}%</span>
            {details && <span>{details}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

