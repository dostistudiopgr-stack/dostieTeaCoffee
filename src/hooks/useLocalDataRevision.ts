import { useEffect, useState } from 'react';
import { subscribeToLocalData } from '../utils/storage';

export function useLocalDataRevision(): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => subscribeToLocalData(() => setRevision((value) => value + 1)), []);
  return revision;
}
