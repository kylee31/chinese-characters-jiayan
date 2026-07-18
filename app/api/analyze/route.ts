const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";

type AnalyzeRequestBody = {
  text?: unknown;
};

function normalizeText(body: AnalyzeRequestBody): string {
  return typeof body.text === "string" ? body.text.trim() : "";
}

export async function POST(request: Request) {
  let body: AnalyzeRequestBody;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = normalizeText(body);
  if (!text) {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(30_000),
    });

    const data: unknown = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json(
      { error: "FastAPI analyzer is not reachable" },
      { status: 502 },
    );
  }
}
