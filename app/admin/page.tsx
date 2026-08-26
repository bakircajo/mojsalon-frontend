// "/admin" used to be a full second copy of the dashboard (1000+ lines, drifted out of
// sync with "/admin/dashboard" — e.g. it still had the old bookings table after the
// calendar refactor). Re-exporting the real page here means the two routes can never
// diverge again.
export { default } from "./dashboard/page";
