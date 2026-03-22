import { SharePageClient } from "./share-client";
import { headers } from "next/headers";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Get the host for building the API URL
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const apiUrl = `${protocol}://${host}/api/share/${token}`;

  // Fetch data server-side for fast initial load
  let data = null;
  let error = null;

  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (res.ok) {
      data = await res.json();
    } else if (res.status === 410) {
      error = "expired";
    } else {
      error = "not_found";
    }
  } catch {
    error = "server_error";
  }

  return <SharePageClient data={data} error={error} token={token} />;
}
