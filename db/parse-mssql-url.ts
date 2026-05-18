// MSSQL connection-string'leri tek bir adapter config tipine indirger ve
// gerektiğinde Prisma'nın beklediği JDBC URL formatına geri serileştirir.
//
// İki format kabul edilir:
//   • JDBC stili (Prisma standardı):
//       sqlserver://HOST:PORT;database=DB;user=USER;password=PASS;encrypt=true;trustServerCertificate=false
//   • ADO.NET stili (MSSQL araçlarının kopyala-yapıştır çıktısı):
//       Server=HOST,PORT;Database=DB;User Id=USER;Password=PASS;Encrypt=True;TrustServerCertificate=False;
//
// Tek source-of-truth `DATABASE_URL`'dir; helper aynı çıktıyı hem runtime
// adapter (`db/prisma.ts`) hem Prisma CLI (`prisma.config.ts`) için üretir.

export type MssqlAdapterConfig = {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
};

const JDBC_PREFIX = "sqlserver://";
const DEFAULT_PORT = 1433;

export function parseMssqlUrl(url: string): MssqlAdapterConfig {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("DATABASE_URL parse edilemedi: değer boş.");
  }
  if (trimmed.startsWith(JDBC_PREFIX)) {
    return parseJdbc(trimmed);
  }
  if (/^server\s*=/i.test(trimmed)) {
    return parseAdoNet(trimmed);
  }
  throw new Error(
    `DATABASE_URL parse edilemedi: "${JDBC_PREFIX}" veya "Server=..." formatı bekleniyor.`,
  );
}

export function formatAsJdbcUrl(config: MssqlAdapterConfig): string {
  // Prisma JDBC URL'inde değerleri ham alır (URL decode etmez). Parolanın
  // `;` veya `=` içermediği varsayılır — bu karakterler key=value;... yapısını
  // bozardı; runtime'da parser bunları zaten reject eder.
  const params = [
    `database=${config.database}`,
    `user=${config.user}`,
    `password=${config.password}`,
    `encrypt=${config.options.encrypt}`,
    `trustServerCertificate=${config.options.trustServerCertificate}`,
  ];
  return `${JDBC_PREFIX}${config.server}:${config.port};${params.join(";")}`;
}

function parseJdbc(url: string): MssqlAdapterConfig {
  const remainder = url.slice(JDBC_PREFIX.length);
  const [hostPart, ...propertyParts] = remainder.split(";");
  if (!hostPart) {
    throw new Error("DATABASE_URL parse edilemedi: sunucu adresi eksik.");
  }

  const [server, portRaw] = hostPart.split(":");
  if (!server) {
    throw new Error("DATABASE_URL parse edilemedi: sunucu adı eksik.");
  }

  const properties = collectProperties(propertyParts);
  return buildConfig({
    server,
    portRaw,
    database: properties.get("database"),
    user: properties.get("user"),
    password: properties.get("password"),
    encryptRaw: properties.get("encrypt"),
    trustRaw: properties.get("trustservercertificate"),
  });
}

function parseAdoNet(url: string): MssqlAdapterConfig {
  const properties = collectProperties(url.split(";"));

  const serverRaw = properties.get("server") ?? properties.get("data source");
  if (!serverRaw) {
    throw new Error("DATABASE_URL parse edilemedi: Server alanı eksik.");
  }
  const [server, portRaw] = serverRaw.split(",");
  if (!server) {
    throw new Error("DATABASE_URL parse edilemedi: sunucu adı eksik.");
  }

  return buildConfig({
    server: server.trim(),
    portRaw: portRaw?.trim(),
    database: properties.get("database") ?? properties.get("initial catalog"),
    user: properties.get("user id") ?? properties.get("uid"),
    password: properties.get("password") ?? properties.get("pwd"),
    encryptRaw: properties.get("encrypt"),
    trustRaw: properties.get("trustservercertificate"),
  });
}

function collectProperties(parts: readonly string[]): Map<string, string> {
  const properties = new Map<string, string>();
  for (const part of parts) {
    if (!part) continue;
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) continue;
    const key = part.slice(0, eqIndex).trim().toLowerCase();
    const value = part.slice(eqIndex + 1).trim();
    if (key) properties.set(key, value);
  }
  return properties;
}

type RawConfig = {
  server: string;
  portRaw: string | undefined;
  database: string | undefined;
  user: string | undefined;
  password: string | undefined;
  encryptRaw: string | undefined;
  trustRaw: string | undefined;
};

function buildConfig(raw: RawConfig): MssqlAdapterConfig {
  const port = raw.portRaw ? Number(raw.portRaw) : DEFAULT_PORT;
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`DATABASE_URL parse edilemedi: geçersiz port "${raw.portRaw}".`);
  }
  if (!raw.database) {
    throw new Error("DATABASE_URL parse edilemedi: database alanı eksik.");
  }
  if (!raw.user) {
    throw new Error("DATABASE_URL parse edilemedi: user alanı eksik.");
  }
  if (!raw.password) {
    throw new Error("DATABASE_URL parse edilemedi: password alanı eksik.");
  }

  return {
    server: raw.server,
    port,
    database: raw.database,
    user: raw.user,
    password: raw.password,
    options: {
      encrypt: parseBool(raw.encryptRaw, true),
      trustServerCertificate: parseBool(raw.trustRaw, false),
    },
  };
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}
