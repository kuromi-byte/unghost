import { Message } from "./schemas";

// ----------------------------------------------------------------
// Parse free-form transcript text into stable-ID message objects.
// Supported formats:
//   [HH:MM] Sender: text
//   Sender: text
//   Sender (timestamp): text
// ----------------------------------------------------------------
export function parseTranscript(raw: string): Message[] {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const messages: Message[] = [];
  let idx = 0;

  // Patterns tried in order:
  //  1.  [HH:MM] Sender: text
  //  2.  Sender (timestamp): text
  //  3.  Sender: text
  const patterns: RegExp[] = [
    /^\[([^\]]+)\]\s+(.+?):\s+(.+)$/,  // [timestamp] Sender: text
    /^(.+?)\s+\(([^)]+)\):\s+(.+)$/,   // Sender (timestamp): text
    /^(.+?):\s+(.+)$/,                  // Sender: text
  ];

  for (const line of lines) {
    let matched = false;

    // pattern 1
    const m1 = patterns[0].exec(line);
    if (m1) {
      messages.push({ id: `msg-${++idx}`, timestamp: m1[1], sender: m1[2].trim(), text: m1[3].trim() });
      matched = true;
    }

    if (!matched) {
      const m2 = patterns[1].exec(line);
      if (m2) {
        messages.push({ id: `msg-${++idx}`, sender: m2[1].trim(), timestamp: m2[2].trim(), text: m2[3].trim() });
        matched = true;
      }
    }

    if (!matched) {
      const m3 = patterns[2].exec(line);
      if (m3) {
        messages.push({ id: `msg-${++idx}`, sender: m3[1].trim(), text: m3[2].trim() });
        matched = true;
      }
    }

    if (!matched && messages.length > 0) {
      // Continuation line — append to last message
      messages[messages.length - 1].text += " " + line;
    }
  }

  return messages;
}
