import { createContext, useContext } from 'react';
import type { TransformPayload } from '../data/transformPayload';

// Payload embedded in a prerendered /transform page (null everywhere else).
const TransformPayloadContext = createContext<TransformPayload | null>(null);

export const TransformPayloadProvider = TransformPayloadContext.Provider;

// eslint-disable-next-line react-refresh/only-export-components
export function useTransformPayload() {
  return useContext(TransformPayloadContext);
}
