import * as cheerio from "cheerio";

const BASE_URL = "https://www.elwis.de";
const BINNEN_INDEX_URL =
  "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Fragenkatalog-Binnen-neu-node.html";
const SEE_INDEX_URL =
  "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-See/Fragenkatalog-See-neu-node.html";

export type ImportedAnswer = {
  text: string;
  correct: boolean;
};

export type ImportedQuestion = {
  text: string;
  imageUrl?: string;
  answers: ImportedAnswer[];
};

type ElwisImporterConfig = {
  indexUrl: string;
  modulePathSegment: string;
};

const BINNEN_CONFIG: ElwisImporterConfig = {
  indexUrl: BINNEN_INDEX_URL,
  modulePathSegment: "/Fragenkatalog-Binnen/",
};

const SEE_CONFIG: ElwisImporterConfig = {
  indexUrl: SEE_INDEX_URL,
  modulePathSegment: "/Fragenkatalog-See/",
};

export async function fetchElwisBinnenQuestions(): Promise<ImportedQuestion[]> {
  return fetchElwisQuestions(BINNEN_CONFIG);
}

export async function fetchElwisSeeQuestions(): Promise<ImportedQuestion[]> {
  return fetchElwisQuestions(SEE_CONFIG);
}

async function fetchElwisQuestions(
  config: ElwisImporterConfig,
): Promise<ImportedQuestion[]> {
  const indexHtml = await fetchHtml(config.indexUrl);
  const moduleLinks = parseIndex(indexHtml, config);
  const questions: ImportedQuestion[] = [];

  for (const url of moduleLinks) {
    const pageHtml = await fetchHtml(url);
    questions.push(...parseQuestions(pageHtml));
  }

  return questions;
}

function parseIndex(html: string, config: ElwisImporterConfig): string[] {
  const $ = cheerio.load(html);
  const content = $("#content");
  const moduleLinks: string[] = [];
  const seen = new Set<string>();
  const normalizedIndexUrl = new URL(config.indexUrl).toString();

  content.find("a.NavNode").each((_, element) => {
    const link = $(element);
    const href = link.attr("href");
    if (!href) return;
    const url = new URL(href, BASE_URL).toString();
    if (!url.includes(config.modulePathSegment)) return;
    if (url === normalizedIndexUrl) return;
    if (seen.has(url)) return;

    moduleLinks.push(url);
    seen.add(url);
  });

  return moduleLinks;
}

function parseQuestions(html: string): ImportedQuestion[] {
  const $ = cheerio.load(html);
  const content = $("#content");
  const elements = content.children().toArray();
  const questions: ImportedQuestion[] = [];

  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index];
    const node = $(element);
    if (!node.is("p")) continue;

    const rawText = normalizeText(node.text());
    if (!/^\d+\./.test(rawText)) continue;

    const questionText = normalizeQuestionText(node);
    if (!questionText) continue;

    let imageUrl = extractImageUrl(node);
    let answersNode: cheerio.Cheerio<cheerio.Element> | null = null;

    for (let cursor = index + 1; cursor < elements.length; cursor += 1) {
      const sibling = $(elements[cursor]);
      if (sibling.is("ol")) {
        answersNode = sibling;
        index = cursor;
        break;
      }
      if (!imageUrl) {
        imageUrl = extractImageUrl(sibling);
      }
      if (sibling.is("p")) {
        const siblingText = normalizeText(sibling.text());
        if (/^\d+\./.test(siblingText)) {
          break;
        }
      }
    }

    if (!answersNode) continue;
    const answers = parseAnswers($, answersNode);
    if (!answers.length) continue;

    questions.push({
      text: questionText,
      imageUrl,
      answers,
    });
  }

  return questions;
}

function parseAnswers(
  $: cheerio.CheerioAPI,
  listNode: cheerio.Cheerio<cheerio.Element>,
): ImportedAnswer[] {
  const answers: ImportedAnswer[] = [];
  listNode.find("li").each((index, element) => {
    const text = normalizeText($(element).text());
    if (!text) return;
    answers.push({
      text,
      correct: index === 0,
    });
  });
  return answers;
}

function normalizeQuestionText(
  node: cheerio.Cheerio<cheerio.Element>,
): string {
  const cleaned = node
    .clone()
    .find("p.picture, img")
    .remove()
    .end()
    .text();

  const normalized = normalizeText(cleaned);
  return normalized.replace(/^\d+\.\s*/, "");
}

function extractImageUrl(
  node: cheerio.Cheerio<cheerio.Element>,
): string | undefined {
  const image = node.find("img").first();
  const src = image.attr("src");
  if (!src) return undefined;
  return new URL(src, BASE_URL).toString();
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}
