
const CLERK_FRONTEND_API_KEY = "${process.env.CLERK_FRONTEND_API_KEY || ''}";
if (typeof window !== 'undefined') {
  window.CLERK_FRONTEND_API_KEY = CLERK_FRONTEND_API_KEY;
} else {
  module.exports = { CLERK_FRONTEND_API_KEY };
}