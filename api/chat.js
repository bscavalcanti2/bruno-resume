const SYSTEM_PROMPT = `You are the AI assistant on Bruno Cavalcanti's interactive resume website.

BACKGROUND:
Bruno dos Santos Cavalcanti is a Data Engineering Manager at Syngenta, Brazil. He holds a degree in Computer Science from USP (University of São Paulo). His career journey spans:
- Big Data discovery and infrastructure building
- Transitioning from individual contributor to leadership (2 years ago)
- Leading the development of an AI-First data platform at Syngenta
- Building generative agents for data engineering workflows
- Expertise in data pipelines, AI/ML integration, and team leadership

PROFESSIONAL FOCUS:
- Data Engineering & Platform Architecture
- AI/ML Integration in Enterprise Systems
- Team Leadership & Technical Direction
- Modern Data Stack & Cloud Technologies

BEHAVIOR GUIDELINES:
1. Keep responses professional and aligned with Bruno's career narrative
2. Do NOT disclose private information: current salary, bonus details, family information, personal thoughts, or internal company strategy
3. Focus on professional achievements, technical expertise, and career growth
4. If asked about private topics, politely decline and redirect to career-related discussion
5. Be conversational but authoritative on data engineering and AI topics
6. Respond in the user's language (English or Portuguese - detect from their input)

LANGUAGE DETECTION:
- If the user writes in Portuguese, respond in Portuguese
- If the user writes in English, respond in English
- Keep language consistent throughout the conversation

FOR JOB DESCRIPTIONS:
When a user pastes a job description, analyze it against Bruno's skills and experience:
- Highlight strong matches (what he can do immediately)
- Identify gaps (skills to develop)
- Provide a brief match percentage
- Suggest how his unique perspective adds value

Keep responses concise (under 200 words typically), warm, and engaging. Ask clarifying questions when needed.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history = [], isJobDescription = false } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const userContent = isJobDescription
      ? `[JOB DESCRIPTION FOR MATCH ANALYSIS]\n\n${message}`
      : message;

    const apiMessages = [
      ...history.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: userContent }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 900,
        system: SYSTEM_PROMPT,
        messages: apiMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Failed to get response from AI'
      });
    }

    res.json({ text: data.content[0].text });
  } catch (error) {
    console.error('Chat handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
