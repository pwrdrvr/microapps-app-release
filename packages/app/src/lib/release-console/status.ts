import type { ReleaseVersionStatus } from './types';

// The deployer marks a version `routed` once its routes are live; `deployed` is the
// terminal state. Earlier statuses cannot serve traffic yet.
export const PROMOTABLE_STATUSES: ReadonlySet<ReleaseVersionStatus> = new Set([
  'routed',
  'deployed',
]);

export function isPromotable(status: ReleaseVersionStatus) {
  return PROMOTABLE_STATUSES.has(status);
}
