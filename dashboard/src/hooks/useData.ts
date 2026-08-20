import { useContext } from 'react';
import { DataContext } from '../context/DataContext';

export function useData() {
  const context = useContext(DataContext);
  return {
    ...context,
    originalData: context.data,
    data: context.filteredData
  };
}
