export interface ValidateOutboundUrlOptions {
  fieldName?: string;
  allowHttp?: boolean;
  disallowCredentialsInUrl?: boolean;
  dnsLookup?: (hostname: string) => Promise<string[]>;
}

export interface ValidateOutboundUrlResult {
  url?: URL;
  error?: string;
}

export interface ResolveRelativeUrlOptions {
  fieldName?: string;
}

const DEFAULT_BLOCKED_HOSTNAME_SUFFIXES = ['.localhost', '.local', '.internal'];
const DEFAULT_BLOCKED_HOSTNAMES = ['localhost', 'local'];

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (DEFAULT_BLOCKED_HOSTNAMES.includes(host)) {
    return true;
  }
  return DEFAULT_BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

function parseIpv4(address: string): number[] | null {
  const parts = address.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return null;
  }
  return parts;
}

function isBlockedIpv4(address: string): boolean {
  const parts = parseIpv4(address);
  if (!parts) return false;

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isProbablyIpv6(address: string): boolean {
  return address.includes(':');
}

function isBlockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized === '::' || normalized === '::1') {
    return true;
  }

  if (normalized.startsWith('::ffff:')) {
    const mapped = normalized.slice('::ffff:'.length);
    return isBlockedIpv4(mapped);
  }

  const firstHextetRaw = normalized.split(':')[0] || '0';
  const firstHextet = parseInt(firstHextetRaw, 16);
  if (Number.isNaN(firstHextet)) {
    return true;
  }

  return (
    (firstHextet & 0xfe00) === 0xfc00 ||
    (firstHextet & 0xffc0) === 0xfe80 ||
    (firstHextet & 0xffc0) === 0xfec0 ||
    (firstHextet & 0xff00) === 0xff00
  );
}

function isPrivateOrReservedIp(hostOrIp: string): boolean {
  if (parseIpv4(hostOrIp)) {
    return isBlockedIpv4(hostOrIp);
  }
  if (isProbablyIpv6(hostOrIp)) {
    return isBlockedIpv6(hostOrIp);
  }
  return false;
}

export async function validateOutboundUrl(
  rawUrl: string,
  options: ValidateOutboundUrlOptions = {},
): Promise<ValidateOutboundUrlResult> {
  const {
    fieldName = 'URL',
    allowHttp = true,
    disallowCredentialsInUrl = true,
    dnsLookup,
  } = options;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { error: `Invalid ${fieldName} format` };
  }

  if (parsed.protocol !== 'https:' && (!allowHttp || parsed.protocol !== 'http:')) {
    return { error: `${fieldName} must use ${allowHttp ? 'http or https' : 'https'}` };
  }

  if (disallowCredentialsInUrl && (parsed.username || parsed.password)) {
    return { error: `${fieldName} must not include credentials in the URL` };
  }

  const host = parsed.hostname.toLowerCase();
  if (isBlockedHostname(host)) {
    return { error: `${fieldName} points to a blocked internal hostname` };
  }

  if (isPrivateOrReservedIp(host)) {
    return { error: `${fieldName} points to a blocked internal IP address` };
  }

  if (dnsLookup) {
    try {
      const addresses = await dnsLookup(host);
      if (!addresses.length) {
        return { error: `${fieldName} host could not be resolved` };
      }
      for (const address of addresses) {
        if (isPrivateOrReservedIp(address)) {
          return { error: `${fieldName} resolves to a blocked internal IP address` };
        }
      }
    } catch {
      return { error: `${fieldName} host could not be resolved` };
    }
  }

  return { url: parsed };
}

export function resolveRelativeUrl(
  baseUrl: string,
  relativePath: string,
  options: ResolveRelativeUrlOptions = {},
): URL {
  const { fieldName = 'Path' } = options;
  const candidate = relativePath.trim();

  if (!candidate) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
  if (candidate.startsWith('//')) {
    throw new Error(`Invalid ${fieldName}: protocol-relative URLs are not allowed.`);
  }
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(candidate)) {
    throw new Error(`Invalid ${fieldName}: absolute URLs are not allowed.`);
  }
  if (candidate.startsWith('/') || candidate.includes('\\')) {
    throw new Error(`Invalid ${fieldName}: only relative paths are allowed.`);
  }
  if (candidate.includes('?') || candidate.includes('#')) {
    throw new Error(`Invalid ${fieldName}: query strings and fragments are not allowed.`);
  }

  const parsedBaseUrl = new URL(baseUrl.replace(/\/+$/, '') + '/');
  const resolved = new URL(candidate, parsedBaseUrl);

  if (resolved.origin !== parsedBaseUrl.origin || !resolved.pathname.startsWith(parsedBaseUrl.pathname)) {
    throw new Error(`Invalid ${fieldName}: resolved URL escapes the configured base URL.`);
  }

  return resolved;
}
