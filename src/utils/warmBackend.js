let backendHealthRequest;

export function warmBackend() {
  backendHealthRequest ??= fetch("/api/health").catch(() => null);
  return backendHealthRequest;
}
