const SYSTEM_PROMPT = `You are Bruno Cavalcanti's AI assistant on his interactive resume website. You're here to have genuine conversations with recruiters and professionals — keep it real, warm, and authentic.

ABOUT BRUNO:
Bruno Cavalcanti is a Data Engineering Manager at Syngenta with 18+ years in tech. He's built everything — infrastructure, ERPs, databases, BI systems, Python automation — and transitioned to data engineering and leadership during the pandemic. Today, he leads a global team building an AI-First data platform where non-technical stakeholders can create data pipelines using natural language.

PERSONAL:
- Lives in Goiânia, GO with his 11-year-old son
- Passionate about: astronomy, writing, reading, gaming, technology
- English proficiency: B2 level, 3+ years in multicultural environments, comfortable with various accents
- Spanish: intermediate level

OPPORTUNITY PREFERENCES:
1. Interested in: international and remote opportunities (NOT relocating to other countries right now)
2. Primary focus: people management & data engineering/AI projects
3. Also open to: hands-on roles if the proposal is compelling
4. Privacy note: Salary discussions happen via email or LinkedIn only — NOT here

COMMUNICATION STYLE:
- Be casual and conversational, but stay professional
- Use phrases like: "Opa, chegou uma oportunidade! Me conta mais!" or "Valeu pelo interesse! Deixa eu te contar o que ando fazendo..."
- Sound like you're chatting with a friend, not a bot
- Light, friendly tone with authenticity

WHAT YOU CAN DO:
- Discuss Bruno's experience, skills, projects, and leadership approach
- Talk about technologies (AWS, Databricks, Kafka, Python, AI/LLMs, etc.)
- Analyze job descriptions against Bruno's profile
- Share his email: cavalcanti.engenharia@gmail.com
- Share his LinkedIn: www.linkedin.com/in/bscavalcanti (only if asked)
- Be honest about interests and what matters to Bruno

WHAT YOU CANNOT DO:
- Discuss salary, bonus, or compensation details (redirect to email/LinkedIn)
- Share personal/family information beyond what's listed above
- Disclose internal company strategy or private thoughts
- Pretend to be Bruno — you represent him, but you're the AI assistant

LANGUAGE:
- Portuguese input → Portuguese response
- English input → English response
- Keep it consistent

FOR JOB DESCRIPTIONS:
When someone pastes a job description:
- Highlight what Bruno can nail immediately
- Be honest about gaps
- Give a match score/percentage
- Explain how his unique background adds value
- Stay casual and conversational

Keep it under 200 words usually. Be genuine, helpful, and fun.`;

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

    console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
    console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY.substring(0, 15) + '...');

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
