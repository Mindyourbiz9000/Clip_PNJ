import { resolve4, resolve6 } from "node:dns/promises";

const PRIVATE_RANGES = [
  // 10.0.0.0/8
  { start: ip4ToNum("10.0.0.0"), end: ip4ToNum("10.255.255.255") },
  // 172.16.0.0/12
  { start: ip4ToNum("172.16.0.0"), end: ip4ToNum("172.31.255.255") },
  // 192.168.0.0/16
  { start: ip4ToNum("192.168.0.0"), end: ip4ToNum("192.168.255.255") },
  // 169.254.0.0/16 (link-local)
  { start: ip4ToNum("169.254.0.0"), end: ip4ToNum("169.254.255.255") },
  // 127.0.0.0/8 (loopback)
  { start: ip4ToNum("127.0.0.0"), end: ip4ToNum("127.255.255.255") },
  // 0.0.0.0/8
  { start: ip4ToNum("0.0.0.0"), end: ip4ToNum("0.255.255.255") },
];

function ip4ToNum(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const num = ip4ToNum(ip);
  return PRIVATE_RANGES.some((r) => num >= r.start && num <= r.end);
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // ::1 loopback
  if (lower === "::1" || lower === "0000:0000:0000:0000:0000:0000:0000:0001")
    return true;
  // fe80::/10 link-local
  if (lower.startsWith("fe80:")) return true;
  // fc00::/7 unique local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  // ::ffff:x.x.x.x mapped IPv4
  const v4Mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Mapped) return isPrivateIPv4(v4Mapped[1]);
  return false;
}

const ALLOWED_EXTENSIONS = [".mp4", ".m3u8"];

export async function validateUrl(raw: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Protocol check
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  // Block credentials in URL
  if (parsed.username || parsed.password) {
    throw new Error("URLs with credentials are not allowed");
  }

  // Block localhost / loopback hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    throw new Error("localhost URLs are not allowed");
  }

  // Check file extension (optional allowlist)
  const pathname = parsed.pathname.toLowerCase();
  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  if (!hasAllowedExt && pathname !== "/" && pathname !== "") {
    // Allow URLs without clear extensions (some CDNs don't use them)
    // but warn: this is a soft check
  }

  // DNS resolution — check all resolved IPs for private ranges
  try {
    let addresses: string[] = [];
    try {
      const ipv4 = await resolve4(hostname);
      addresses = addresses.concat(ipv4);
    } catch {
      // no A records
    }
    try {
      const ipv6 = await resolve6(hostname);
      addresses = addresses.concat(ipv6);
    } catch {
      // no AAAA records
    }

    if (addresses.length === 0) {
      throw new Error("Could not resolve hostname");
    }

    for (const addr of addresses) {
      if (addr.includes(":")) {
        if (isPrivateIPv6(addr)) {
          throw new Error("URL resolves to a private/internal IP address");
        }
      } else {
        if (isPrivateIPv4(addr)) {
          throw new Error("URL resolves to a private/internal IP address");
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("private")) throw err;
    if (err instanceof Error && err.message.includes("resolve")) throw err;
    throw new Error("DNS resolution failed for the provided URL");
  }

  return parsed.toString();
}
