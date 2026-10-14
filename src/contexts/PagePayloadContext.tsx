import { createContext, useContext } from 'react';
import type { PagePayload } from '../data/transformPayload';

// Payload embedded in a prerendered page (null everywhere else).
const PagePayloadContext = createContext<PagePayload | null>(null);

export const PagePayloadProvider = PagePayloadContext.Provider;

// eslint-disable-next-line react-refresh/only-export-components
export function usePagePayload() {
  return useContext(PagePayloadContext);
}
