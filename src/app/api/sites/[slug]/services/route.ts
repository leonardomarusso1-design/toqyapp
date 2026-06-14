export async function PATCH() {
  return Response.json({ ok: true, source: "mock", note: "Services are saved in localStorage by the client in this MVP." });
}
