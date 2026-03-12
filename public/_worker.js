// Cloudflare Pages _worker.js for EchoDrift
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      let response = await env.ASSETS.fetch(request);
      if (!response.ok && !url.pathname.includes('.')) {
        const indexRequest = new Request(new URL('/index.html', request.url), request);
        return await env.ASSETS.fetch(indexRequest);
      }
      return response;
    } catch (_) {
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      return await env.ASSETS.fetch(indexRequest);
    }
  },
};
