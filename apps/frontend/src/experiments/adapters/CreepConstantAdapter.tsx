import { CreepConstant } from '../creepConstant/CreepConstant';
import type { ExperimentProps } from '../types';

export default function CreepConstantAdapter({ initialState, isReadOnly }: ExperimentProps) {
  return <CreepConstant initialState={initialState} isReadOnly={isReadOnly} />;
}
