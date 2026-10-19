import type { ComponentProps } from 'react';
import { OhmsLaw } from '../ohmsLaw/OhmsLaw';
import type { ExperimentProps } from '../types';

export default function OhmsLawAdapter({ initialState, isReadOnly }: ExperimentProps) {
  const initialParameters =
    initialState && typeof initialState === 'object'
      ? (initialState as ComponentProps<typeof OhmsLaw>['initialParameters'])
      : undefined;

  return <OhmsLaw initialParameters={initialParameters} isReadOnly={isReadOnly} />;
}
