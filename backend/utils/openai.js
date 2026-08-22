// Thin wrapper around the OpenAI Chat Completions API.
// Uses the built-in fetch available in Node 18+.

const SYSTEM_PROMPT = `You are the virtual assistant for "Vakeel Sahab", a legal services platform
representing lawyers and a website-development specialist.

Ground rules:
- Answer general questions about the services offered (transport & motor vehicle legal matters,
  other legal services, and website development services) clearly and helpfully.
- Do NOT give specific legal advice, predict case outcomes, or quote fees/prices you are not certain of.
  Instead, direct the user to book a consultation with the relevant lawyer.
- If asked about something outside Vakeel Sahab's services, politely say you can only help with
  Vakeel Sahab related queries and offer to connect them with the team.
- Keep answers concise and friendly. Encourage booking a consultation or using the contact form
  when the query needs a professional's attention.
- Never invent lawyer names, qualifications, prices, or guarantees you don't have information about.`;

async function getChatbotReply(conversationHistory) {
  // conversationHistory: array of { sender: 'user' | 'assistant', content: string }
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map((m) => ({
      role: m.sender === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.4,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a reply just now.";
}

module.exports = { getChatbotReply };
