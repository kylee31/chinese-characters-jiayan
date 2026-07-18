const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";

type LexiconRequestBody = {
  text?: unknown;
  limit?: unknown;
};

function normalizeText(body: LexiconRequestBody): string {
  return typeof body.text === "string" ? body.text.trim() : "";
}

function normalizeLimit(body: LexiconRequestBody): number {
  return typeof body.limit === "number" && Number.isInteger(body.limit)
    ? body.limit
    : 100;
}

export async function POST(request: Request) {
  let body: LexiconRequestBody;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = normalizeText(body);
  if (!text) {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  const limit = normalizeLimit(body);

  try {
    const response = await fetch(
      `${FASTAPI_BASE_URL}/api/v1/lexicon/construct`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, limit }),
        signal: AbortSignal.timeout(30_000),
      },
    );

    const data: unknown = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json(
      { error: "FastAPI lexicon constructor is not reachable" },
      { status: 502 },
    );
  }
}
