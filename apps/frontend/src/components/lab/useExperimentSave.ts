import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  SaveStatus,
  UseExperimentSaveOptions,
  UseExperimentSaveReturn,
} from './types';

export function useExperimentSave<T>({
  experimentId,
  isSavedState,
  initialState,
  isReadOnly = false,
  defaultTitle = 'My experiment setup',
}: UseExperimentSaveOptions<T>): UseExperimentSaveReturn<T> {
  const [searchParams] = useSearchParams();
  const savedIdFromUrl =
    searchParams.get('savedId') ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('savedId')
      : null);

  const [currentSavedId, setCurrentSavedId] = useState<string | null>(savedIdFromUrl);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  // Initialize loadedState lazily from initialState if valid
  const [loadedState, setLoadedState] = useState<T | null>(() => {
    if (initialState && isSavedState(initialState)) {
      return initialState;
    }
    return null;
  });

  useEffect(() => {
    if (initialState || !savedIdFromUrl) return;

    let isMounted = true;

    async function fetchSavedSession() {
      try {
        const res = await fetch(`/api/v1/experiments/${savedIdFromUrl}`, {
          credentials: 'include',
        });

        if (!isMounted) return;

        if (!res.ok) {
          setStatus('error');
          setMessage('Could not load saved experiment session.');
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        const rawState = data?.state ?? data?.data?.state ?? data?.stateData;
        if (isSavedState(rawState)) {
          setLoadedState(rawState);
          setCurrentSavedId(data.id ?? savedIdFromUrl);
          setStatus('idle');
          setMessage(null);
        } else {
          setStatus('error');
          setMessage('Saved experiment session has an invalid state format.');
        }
      } catch {
        if (isMounted) {
          setStatus('error');
          setMessage('Network error while loading saved experiment. Please check your connection.');
        }
      }
    }

    fetchSavedSession();

    return () => {
      isMounted = false;
    };
  }, [savedIdFromUrl, initialState, isSavedState]);

  const save = useCallback(
    async (state: T, title?: string, notes?: string): Promise<boolean> => {
      if (isReadOnly) {
        setMessage('Cannot save in read-only mode.');
        return false;
      }

      const serialized = JSON.stringify(state);
      const byteSize = new TextEncoder().encode(serialized).length;

      if (byteSize > 60000) {
        setStatus('error');
        setMessage(
          `Experiment state size (${byteSize} bytes) exceeds the maximum allowed limit of 60,000 bytes.`
        );
        return false;
      }

      setStatus('saving');
      setMessage(null);

      const payload = {
        title: (title || defaultTitle).trim(),
        notes: notes || '',
        state,
      };

      try {
        const res = await fetch(
          currentSavedId ? `/api/v1/experiments/${currentSavedId}` : '/api/v1/experiments',
          {
            method: currentSavedId ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(
              currentSavedId ? payload : { ...payload, experimentId }
            ),
          }
        );

        if (!res.ok) {
          setStatus('error');
          setMessage('Failed to save experiment setup. Server returned an error.');
          return false;
        }

        const resData = (await res.json()) as { id?: string };
        if (!currentSavedId && resData?.id) {
          setCurrentSavedId(resData.id);
        }

        setStatus('saved');
        setMessage('Session saved successfully.');
        return true;
      } catch {
        setStatus('error');
        setMessage('Network error while saving experiment. Please check your connection.');
        return false;
      }
    },
    [currentSavedId, defaultTitle, experimentId, isReadOnly]
  );

  return {
    status,
    message,
    save,
    currentSavedId,
    loadedState,
  };
}
