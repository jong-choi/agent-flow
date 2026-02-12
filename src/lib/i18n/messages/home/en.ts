const message = {
  metaDescription: "A visual platform for building and running AI agents with flowcharts.",
  hero: {
    ctaStart: "Get Started",
    subtitleLine1: "Flowchart Agent",
    subtitleLine2: "Build your own AI agent",
  },
  canvas: {
    descriptionLine1: "Drag and drop nodes, then connect them with edges.",
    descriptionLine2: "Combine chat, search, and documents in one flow.",
    cta: "Go to Canvas",
    nodes: {
      presets: "Presets",
      llmCall: "LLM Call",
      search: "Search",
      document: "Document",
      fanOut: "Fan-out",
      output: "Output",
    },
  },
  howItWorks: {
    designDesc: "Design your agent logic on the canvas with nodes and edges.",
    configureDesc: "Configure prompts, tools, and models for each node.",
    chatDesc: "Test your workflow instantly in the chat interface.",
    deployDesc: "Issue API keys and deploy your agent to external services.",
  },
  chat: {
    descriptionLine1: "Run your designed workflow instantly through chat.",
    descriptionLine2: "Supports multi-turn conversations with memory and context.",
    demo: {
      userLabel: "User",
      agentLabel: "Agent",
      userMessage1: "Search current slang trends and save them to a document.",
      agentMessage: "Sure, I will draft it based on the search results.",
      userMessage2: "Add a blog post optimized for SEO.",
    },
  },
  presets: {
    descriptionLine1: "Discover community-made agent presets,",
    descriptionLine2: "buy with credits, and use them instantly.",
    cta: "Browse Presets",
    free: "Free",
    priceCredits: "{count} credits",
    items: {
      customerSupport: {
        name: "Customer Support Chatbot",
        tag: "Support",
      },
      seoBlog: {
        name: "SEO Keyword Blog Writer",
        tag: "Marketing",
      },
      projectManagement: {
        name: "Project Management Chatbot",
        tag: "Operations",
      },
      parallelCode: {
        name: "Parallel Code Writer",
        tag: "Development",
      },
    },
  },
  credits: {
    descriptionLine1: "Earn free credits with daily attendance check-ins.",
    cta: "Check Attendance",
    currentBalance: "Current Balance",
    days: {
      mon: "M",
      tue: "T",
      wed: "W",
      thu: "T",
      fri: "F",
      sat: "S",
      sun: "S",
    },
  },
  developerApi: {
    descriptionLine1:
      "Connect your existing SDK code through an OpenAI-compatible endpoint,",
    descriptionLine2: "and invoke agent workflows right away.",
    cta: "View API Docs",
    examplePrompt: "Tell me how to raise a puppy.",
  },
  cta: {
    descriptionLine1: "Get started now and claim free credits.",
    descriptionLine2: "Build AI agents without coding.",
    button: "Get Started",
  },
};

export default message;
