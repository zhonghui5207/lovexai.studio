export function respData(data: unknown) {
  return respJson(0, "ok", data || []);
}

export function respOk() {
  return respJson(0, "ok");
}

export function respErr(message: string, status?: number) {
  const json = {
    code: -1,
    message: message,
  };
  return new Response(JSON.stringify(json), {
    status: status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function respJson(code: number, message: string, data?: unknown) {
  const json: { code: number; message: string; data?: unknown } = {
    code: code,
    message: message,
    data: data,
  };
  if (data) {
    json["data"] = data;
  }

  return Response.json(json);
}
