/* ========================================
   Fake API Layer
   Intercepts fetch() and returns local mock data.
   ======================================== */

const MockData = {
  // Add mock data objects here as needed per session
};

const originalFetch = window.fetch;

window.fetch = function(url, options) {
  // If the URL starts with /api/, intercept it
  if (typeof url === 'string' && url.startsWith('/api/')) {
    return handleMockRequest(url, options);
  }
  // Otherwise, pass through to real fetch
  return originalFetch.call(this, url, options);
};

function handleMockRequest(url, options) {
  return new Promise(resolve => {
    // Simulate network delay
    setTimeout(() => {
      const path = url.replace('/api/', '');
      const data = MockData[path];

      if (data) {
        resolve(new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      } else {
        resolve(new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
    }, 200);
  });
}
