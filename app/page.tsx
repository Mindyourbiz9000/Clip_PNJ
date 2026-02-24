"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "processing" | "success" | "error";

export default function Home() {
  const [url, setUrl] = useState("");
  const [start, setStart] = useState("00:00:00");
  const [end, setEnd] = useState("00:01:00");
  const [format, setFormat] = useState<"landscape" | "vertical" | "square">(
    "landscape"
  );
  const [limit60, setLimit60] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("processing");
    setErrorMsg("");

    try {
      const res = await fetch("/api/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, start, end, format, limit60 }),
      });

      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try {
          const json = await res.json();
          if (json.error) msg = json.error;
        } catch {
          // response wasn't JSON
        }
        setErrorMsg(msg);
        setStatus("error");
        return;
      }

      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = "quickclip.mp4";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);

      setStatus("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
      setStatus("error");
    }
  }

  const statusColors: Record<Status, string> = {
    idle: "text-gray-400",
    processing: "text-yellow-400",
    success: "text-green-400",
    error: "text-red-400",
  };

  const statusText: Record<Status, string> = {
    idle: "Ready",
    processing: "Processing… this may take a moment",
    success: "Clip downloaded!",
    error: errorMsg || "Something went wrong",
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">QuickClip</h1>
        <p className="mb-6 text-sm text-gray-400">
          Paste a direct video URL, pick your clip range, and download.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL */}
          <div>
            <label htmlFor="url" className="mb-1 block text-sm font-medium">
              Video URL
            </label>
            <input
              id="url"
              type="url"
              required
              placeholder="https://example.com/video.mp4"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start"
                className="mb-1 block text-sm font-medium"
              >
                Start (HH:MM:SS)
              </label>
              <input
                id="start"
                type="text"
                required
                pattern="\d{2}:\d{2}:\d{2}"
                placeholder="00:00:00"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end" className="mb-1 block text-sm font-medium">
                End (HH:MM:SS)
              </label>
              <input
                id="end"
                type="text"
                required
                pattern="\d{2}:\d{2}:\d{2}"
                placeholder="00:01:00"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Format */}
          <div>
            <label
              htmlFor="format"
              className="mb-1 block text-sm font-medium"
            >
              Format
            </label>
            <select
              id="format"
              value={format}
              onChange={(e) =>
                setFormat(e.target.value as "landscape" | "vertical" | "square")
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="landscape">16:9 — Landscape</option>
              <option value="vertical">9:16 — Vertical</option>
              <option value="square">1:1 — Square</option>
            </select>
          </div>

          {/* Limit 60s */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={limit60}
              onChange={(e) => setLimit60(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
            />
            Limit to 60 seconds
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "processing"}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "processing" ? "Generating…" : "Generate Clip"}
          </button>
        </form>

        {/* Status */}
        <div className={`mt-4 text-center text-sm ${statusColors[status]}`}>
          {statusText[status]}
        </div>
      </div>
    </main>
  );
}
