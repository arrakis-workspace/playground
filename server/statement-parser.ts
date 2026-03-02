import * as pdfParse from "pdf-parse";

export interface ParsedHolding {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
}

type BrokerageType = "fidelity" | "vanguard" | "schwab" | "merrill" | "robinhood" | "etrade" | "morgan_stanley" | "unknown";

function detectBrokerage(text: string): BrokerageType {
  const lower = text.toLowerCase();
  if (lower.includes("fidelity") || lower.includes("fidelity investments")) return "fidelity";
  if (lower.includes("vanguard")) return "vanguard";
  if (lower.includes("charles schwab") || lower.includes("schwab")) return "schwab";
  if (lower.includes("merrill lynch") || lower.includes("merrill edge") || lower.includes("merrill")) return "merrill";
  if (lower.includes("robinhood")) return "robinhood";
  if (lower.includes("e*trade") || lower.includes("etrade") || lower.includes("e-trade")) return "etrade";
  if (lower.includes("morgan stanley")) return "morgan_stanley";
  return "unknown";
}

function parseFidelity(text: string): ParsedHolding[] {
  const holdings: ParsedHolding[] = [];
  const lines = text.split("\n");
  const tickerPattern = /^([A-Z]{1,5})\s+(.+?)\s+([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d{2})\s+\$?([\d,]+\.?\d{2})/;
  for (const line of lines) {
    const match = line.match(tickerPattern);
    if (match) {
      const symbol = match[1];
      const name = match[2].trim();
      const quantity = parseFloat(match[3].replace(/,/g, ""));
      const price = parseFloat(match[4].replace(/,/g, ""));
      if (quantity > 0 && price > 0 && symbol.length <= 5) {
        holdings.push({ symbol, name, quantity, purchasePrice: price });
      }
    }
  }
  return holdings;
}

function parseVanguard(text: string): ParsedHolding[] {
  const holdings: ParsedHolding[] = [];
  const lines = text.split("\n");
  const pattern = /([A-Z]{1,5})\s+(.+?)\s+([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d{2})/;
  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      const symbol = match[1];
      const name = match[2].trim();
      const quantity = parseFloat(match[3].replace(/,/g, ""));
      const price = parseFloat(match[4].replace(/,/g, ""));
      if (quantity > 0 && price > 0 && symbol.length <= 5) {
        holdings.push({ symbol, name, quantity, purchasePrice: price });
      }
    }
  }
  return holdings;
}

function parseSchwab(text: string): ParsedHolding[] {
  return parseGeneric(text);
}

function parseMerrill(text: string): ParsedHolding[] {
  return parseGeneric(text);
}

function parseRobinhood(text: string): ParsedHolding[] {
  return parseGeneric(text);
}

function parseEtrade(text: string): ParsedHolding[] {
  return parseGeneric(text);
}

function parseMorganStanley(text: string): ParsedHolding[] {
  return parseGeneric(text);
}

function parseGeneric(text: string): ParsedHolding[] {
  const holdings: ParsedHolding[] = [];
  const seen = new Set<string>();
  const lines = text.split("\n");

  const patterns = [
    /([A-Z]{1,5})\s+(.{2,40}?)\s+([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d{2})\s+\$?([\d,]+\.?\d{2})/,
    /([A-Z]{1,5})\s+([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d{2})\s+\$?([\d,]+\.?\d{2})/,
    /([A-Z]{1,5})\s+(.{2,40}?)\s+([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d{2})/,
  ];

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        let symbol: string, name: string, quantity: number, price: number;

        if (match.length >= 6) {
          symbol = match[1];
          name = match[2].trim();
          quantity = parseFloat(match[3].replace(/,/g, ""));
          price = parseFloat(match[4].replace(/,/g, ""));
        } else if (match.length === 5 && !match[2].match(/[a-zA-Z]/)) {
          symbol = match[1];
          name = symbol;
          quantity = parseFloat(match[2].replace(/,/g, ""));
          price = parseFloat(match[3].replace(/,/g, ""));
        } else {
          symbol = match[1];
          name = match[2]?.trim() || symbol;
          quantity = parseFloat(match[3].replace(/,/g, ""));
          price = parseFloat(match[4]?.replace(/,/g, "") || "0");
        }

        if (quantity > 0 && price > 0 && symbol.length <= 5 && !seen.has(symbol)) {
          const commonNonTickers = new Set(["THE", "AND", "FOR", "WITH", "FROM", "CASH", "TOTAL", "DATE", "TYPE", "NAME", "PRICE", "VALUE", "SHARE"]);
          if (!commonNonTickers.has(symbol)) {
            seen.add(symbol);
            holdings.push({ symbol, name, quantity, purchasePrice: price });
          }
        }
        break;
      }
    }
  }

  return holdings;
}

export async function parseStatement(buffer: Buffer): Promise<{ brokerage: string; holdings: ParsedHolding[] }> {
  const pdf = (pdfParse as any).default || pdfParse;
  const data = await pdf(buffer);
  const text = data.text;
  const brokerage = detectBrokerage(text);

  let holdings: ParsedHolding[];

  switch (brokerage) {
    case "fidelity":
      holdings = parseFidelity(text);
      break;
    case "vanguard":
      holdings = parseVanguard(text);
      break;
    case "schwab":
      holdings = parseSchwab(text);
      break;
    case "merrill":
      holdings = parseMerrill(text);
      break;
    case "robinhood":
      holdings = parseRobinhood(text);
      break;
    case "etrade":
      holdings = parseEtrade(text);
      break;
    case "morgan_stanley":
      holdings = parseMorganStanley(text);
      break;
    default:
      holdings = parseGeneric(text);
  }

  return { brokerage, holdings };
}
