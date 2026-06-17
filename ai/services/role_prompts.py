"""
Role-specific interview competency maps and prompt strategies.
Used to generate targeted, domain-specific questions and acknowledgments.
"""

# --- ROLE COMPETENCY MAPS ---
# Each role has: domains (topic areas to cover), question_types, seniority_focus
ROLE_CONFIG = {
    "Backend SDE": {
        "domains": [
            "System Design & Scalability",
            "Database Design (SQL/NoSQL, indexing, query optimization)",
            "API Design (REST, gRPC, GraphQL)",
            "Caching strategies (Redis, Memcached)",
            "Concurrency & Multithreading",
            "Microservices & Event-driven architecture",
            "Security (Auth, JWT, OAuth, HTTPS)",
            "Performance profiling & debugging",
            "CI/CD & DevOps basics",
        ],
        "tech_stack_examples": "Node.js, Python, Java, Go, PostgreSQL, Redis, Docker, Kafka",
        "star_context": "backend services, API design, database performance, system reliability",
        "key_expectations": "You should test deep technical knowledge of distributed systems, data consistency, and performance optimization. Avoid generic CS theory — focus on practical applied backend scenarios.",
    },

    "Frontend SDE": {
        "domains": [
            "React/Vue/Angular component lifecycle and rendering optimization",
            "State management (Redux, Zustand, Context API, Recoil)",
            "Browser rendering pipeline (layout, paint, compositing)",
            "Performance optimization (lazy loading, code splitting, memoization)",
            "Accessibility (WCAG, ARIA roles, semantic HTML)",
            "CSS architecture (BEM, CSS Modules, Tailwind, animations)",
            "Network requests (fetch, axios, error handling, caching)",
            "Testing (Jest, React Testing Library, Cypress, Storybook)",
            "Build tools (Vite, Webpack, esbuild)",
        ],
        "tech_stack_examples": "React, TypeScript, Next.js, Vite, Tailwind CSS, Jest, Cypress",
        "star_context": "UI performance improvements, component architecture, accessibility wins",
        "key_expectations": "Focus on practical implementation depth. Ask about trade-offs in framework choices, performance debugging stories, and how they handle complex UI state.",
    },

    "Full Stack SDE": {
        "domains": [
            "End-to-end application architecture (frontend + backend + DB)",
            "REST API design and consumption from frontend",
            "Database selection criteria (SQL vs NoSQL trade-offs)",
            "Authentication flows (JWT, session cookies, OAuth)",
            "Deployment strategies (Docker, CI/CD, Vercel, AWS)",
            "React/Next.js with server-side vs client-side rendering",
            "Real-time features (WebSockets, SSE, polling)",
            "Monorepo architecture and code sharing",
            "Debugging across the stack",
        ],
        "tech_stack_examples": "React, Node.js, PostgreSQL, Redis, Docker, Prisma, Next.js",
        "star_context": "cross-stack features, integration challenges, deployment war stories",
        "key_expectations": "Test ability to reason about the entire system. Ask about specific cross-stack challenges — where does the data come from, how is it cached, what breaks first under load?",
    },

    "ML Engineer": {
        "domains": [
            "Model selection and evaluation (bias-variance, metrics: AUC, F1, RMSE)",
            "Feature engineering and preprocessing pipelines",
            "Training pipeline design (batching, augmentation, distributed training)",
            "Model deployment and serving (FastAPI, TorchServe, ONNX, BentoML)",
            "MLOps (experiment tracking with MLflow/W&B, versioning, monitoring)",
            "Deep learning fundamentals (CNNs, Transformers, attention mechanisms)",
            "NLP tasks (tokenization, fine-tuning LLMs, RAG systems)",
            "Data engineering for ML (ETL, feature stores, data drift detection)",
            "Productionization (latency optimization, batching, caching predictions)",
        ],
        "tech_stack_examples": "Python, PyTorch, TensorFlow, scikit-learn, MLflow, Hugging Face, FastAPI, Spark",
        "star_context": "model improvements, data pipeline design, production ML challenges",
        "key_expectations": "Focus on applied ML, not pure theory. Ask about real model debugging, how they handle class imbalance, and how they've moved models from notebooks to production.",
    },

    "Data Scientist": {
        "domains": [
            "Statistical foundations (hypothesis testing, p-values, confidence intervals)",
            "Exploratory Data Analysis (EDA) and visualization",
            "Supervised/Unsupervised learning (regression, clustering, classification)",
            "Feature selection and dimensionality reduction (PCA, UMAP)",
            "A/B testing design and analysis",
            "SQL for data extraction and transformation",
            "Python data stack (pandas, NumPy, matplotlib, seaborn)",
            "Business communication of insights and storytelling with data",
            "Time series analysis and forecasting",
        ],
        "tech_stack_examples": "Python, pandas, scikit-learn, SQL, Tableau, dbt, Spark, Jupyter",
        "star_context": "business impact of data projects, experiment design, insight communication",
        "key_expectations": "Blend technical rigor with business impact. Ask how they've influenced decisions with data. Test statistical intuition with concrete scenarios, not formulas.",
    },

    "Java Developer": {
        "domains": [
            "Java core (JVM internals, memory model, GC tuning, Java 17+ features)",
            "Spring Boot (dependency injection, REST APIs, Spring Security)",
            "Concurrency (ExecutorService, CompletableFuture, synchronized, volatile)",
            "Design Patterns (Builder, Factory, Strategy, Observer, Singleton pitfalls)",
            "JPA/Hibernate (lazy vs eager loading, N+1 problem, transactions)",
            "Microservices with Spring Cloud (service discovery, circuit breakers)",
            "Build tools (Maven, Gradle) and testing (JUnit 5, Mockito)",
            "Performance (profiling with JProfiler/VisualVM, heap dumps)",
            "Message queuing (Kafka, RabbitMQ with Spring AMQP)",
        ],
        "tech_stack_examples": "Java 17+, Spring Boot 3, Hibernate, Maven, Kafka, Docker, PostgreSQL",
        "star_context": "Spring app performance, JVM tuning, service design patterns",
        "key_expectations": "Test Java-specific knowledge deeply — JVM behavior, Spring internals, and real concurrency problems. Avoid surface-level 'what is polymorphism' questions.",
    },

    "Mobile Engineer": {
        "domains": [
            "React Native / Flutter cross-platform architecture",
            "iOS (Swift, UIKit, SwiftUI, CoreData, XCode)",
            "Android (Kotlin, Jetpack Compose, Room, MVVM)",
            "App performance (frame rates, memory, battery optimization)",
            "State management on mobile (Redux/Zustand for RN, ViewModel for Android)",
            "App store deployment (CI/CD, code signing, TestFlight, Play Console)",
            "Push notifications and background processing",
            "Offline-first patterns and local data sync",
            "Native bridging and third-party SDK integration",
        ],
        "tech_stack_examples": "React Native, Flutter, Swift, Kotlin, Firebase, Expo, Fastlane",
        "star_context": "performance improvements, cross-platform challenges, app store submissions",
        "key_expectations": "Focus on platform-specific trade-offs and real performance wins. Ask about specific bugs they've fixed in the wild (crashes, memory leaks, jank).",
    },

    "Product Manager": {
        "domains": [
            "Product strategy and roadmap prioritization (RICE, MoSCoW, Kano)",
            "User research (interviews, surveys, usability testing)",
            "Metrics definition (North Star, OKRs, KPIs, leading vs lagging indicators)",
            "Stakeholder management and cross-functional alignment",
            "Feature scoping and requirement writing (PRDs, user stories)",
            "A/B testing and data-driven decision making",
            "Go-to-market strategy and product launches",
            "Competitive analysis and market positioning",
            "Technical literacy (working with engineers, understanding APIs/systems)",
        ],
        "tech_stack_examples": "Jira, Figma, Mixpanel, Amplitude, SQL, Google Analytics, Notion",
        "star_context": "product launches, stakeholder conflicts, metric improvements",
        "key_expectations": "Focus on decision frameworks, trade-off reasoning, and impact storytelling. Test how they handle ambiguity, competing priorities, and disagreements with engineering.",
    },
}

# Default fallback for unknown roles
DEFAULT_ROLE_CONFIG = {
    "domains": [
        "Problem-solving and analytical thinking",
        "System design fundamentals",
        "Communication and collaboration",
        "Previous project experience",
        "Technical decision-making",
    ],
    "tech_stack_examples": "Varies by specialization",
    "star_context": "past projects, team collaboration, technical decisions",
    "key_expectations": "Focus on structured problem-solving, clear communication, and evidence of learning from challenges.",
}

def get_role_config(role: str) -> dict:
    """Get role-specific config, with fuzzy matching for common variations."""
    role_lower = role.lower()

    # Exact match first
    if role in ROLE_CONFIG:
        return ROLE_CONFIG[role]

    # Fuzzy match
    role_map = {
        "backend": "Backend SDE",
        "frontend": "Frontend SDE",
        "fullstack": "Full Stack SDE",
        "full stack": "Full Stack SDE",
        "machine learning": "ML Engineer",
        "ml": "ML Engineer",
        "ai engineer": "ML Engineer",
        "data science": "Data Scientist",
        "data analyst": "Data Scientist",
        "java": "Java Developer",
        "android": "Mobile Engineer",
        "ios": "Mobile Engineer",
        "react native": "Mobile Engineer",
        "flutter": "Mobile Engineer",
        "mobile": "Mobile Engineer",
        "product": "Product Manager",
        "pm": "Product Manager",
    }

    for key, mapped_role in role_map.items():
        if key in role_lower:
            return ROLE_CONFIG[mapped_role]

    return DEFAULT_ROLE_CONFIG


def get_question_generation_prompt(
    role: str,
    interview_type: str,
    experience_level: str,
    chat_history: list,
    previous_questions: list,
    resume_ctx: str,
    selected_domain: str = None,
) -> str:
    """
    HackerRank / Unstop style domain-cycling prompt.
    - Every question is locked to a specific domain from the role curriculum.
    - Domains rotate in order so every area gets covered.
    - No generic filler questions allowed.
    - Per-domain adaptive difficulty based on how candidate performed last time.
    """
    cfg = get_role_config(role)
    domains = cfg["domains"]
    domains_numbered = "\n".join(f"  {i+1}. {d}" for i, d in enumerate(domains))

    # Build conversation history and analyse per-domain performance
    conversation_str = ""
    last_answer = ""
    total_answers = 0
    domain_performance: dict = {}   # domain_index -> list of "strong" | "weak" | "ok"

    if chat_history:
        for i, turn in enumerate(chat_history):
            q = turn.get("question", "")
            a = turn.get("answer", "")
            if q:
                conversation_str += f"Q{i+1}: {q}\n"
            if a:
                conversation_str += f"Candidate's Answer: {a}\n\n"
                total_answers += 1
                if i == len(chat_history) - 1:
                    last_answer = a

                domain_idx = i % len(domains)
                word_count = len(a.split())
                is_strong = word_count > 100 and any(
                    kw in a.lower() for kw in
                    ["because", "which", "resulted", "reduced", "improved",
                     "%", "implemented", "designed", "optimized", "trade-off"]
                )
                is_weak = word_count < 50 or a.count("I ") < 1
                grade = "strong" if is_strong else ("weak" if is_weak else "ok")
                domain_performance.setdefault(domain_idx, []).append(grade)

    is_first_question = not bool(conversation_str.strip())

    # Pick which domain to test next (cycle through in order, unless specific domain is selected)
    if selected_domain and selected_domain.strip() and selected_domain.lower() != "all domains":
        next_domain = selected_domain
        next_domain_idx = 0
        for idx, d in enumerate(domains):
            if d.lower() == selected_domain.lower():
                next_domain_idx = idx
                break
    else:
        next_domain_idx = total_answers % len(domains)
        next_domain = domains[next_domain_idx]

    # Set per-domain difficulty
    perf = domain_performance.get(next_domain_idx, [])
    if not perf:
        adaptive_difficulty = "medium"
        difficulty_rationale = f"First question on '{next_domain}'. Start at medium difficulty."
    elif perf.count("strong") > perf.count("weak"):
        adaptive_difficulty = "hard"
        difficulty_rationale = f"Candidate handled '{next_domain}' well. Escalate depth."
    elif perf.count("weak") > perf.count("strong"):
        adaptive_difficulty = "easy"
        difficulty_rationale = f"Candidate struggled on '{next_domain}'. Use a scaffolded question."
    else:
        adaptive_difficulty = "medium"
        difficulty_rationale = f"Mixed results on '{next_domain}'. Use a focused medium scenario."

    # Interview-type style guide
    type_instructions = {
        "technical": (
            f"Ask a hands-on TECHNICAL scenario question strictly about: {next_domain}. "
            f"Describe a real system situation the candidate must solve, NOT a textbook definition. "
            f"Pattern: 'You are building X and encounter Y — how do you handle it using {next_domain}?'"
        ),
        "behavioural": (
            f"Ask a STAR-format behavioural question anchored to: {next_domain}. "
            f"Use 'Tell me about a time when...' or 'Describe a situation where...'. "
            f"Context: {cfg['star_context']}."
        ),
        "resume_based": (
            f"Base the question on the candidate's resume AND specifically on: {next_domain}. "
            f"Ask them to walk through a specific decision they made in this domain. "
            f"Follow up with: 'What trade-offs did you consider?'"
        ),
    }
    type_guide = type_instructions.get(interview_type, type_instructions["technical"])

    # Task block (differs for first question vs follow-up)
    if is_first_question:
        task_block = (
            "Since this is the first question: greet the candidate in exactly ONE short sentence, "
            "then immediately ask your first domain-specific question. Do NOT give a long introduction."
        )
    else:
        task_block = (
            f'The candidate just answered: "{last_answer[:500]}"\n\n'
            f"Step 1 — Acknowledge (1-2 sentences): React to something SPECIFIC they said. "
            f"If they missed key details about {next_domain}, call it out precisely.\n"
            f"Step 2 — Ask: Generate the next question for domain #{next_domain_idx + 1} "
            f"({next_domain}) at {adaptive_difficulty} difficulty."
        )

    prompt = f"""You are a professional AI interviewer running a structured mock interview for:
Role: {role}  |  Experience level: {experience_level}  |  Interview type: {interview_type}

You operate like HackerRank / Unstop mock interviews:
- Every question MUST come from a specific domain in the curriculum below.
- Domains are tested in order — no skipping, no repeating.
- NEVER ask generic questions ("Tell me about yourself", "What is a challenge you faced?").
- Every question_text MUST begin with the domain label in square brackets.
  Example: "[Caching Strategies] Your Redis cache is evicting keys unexpectedly under load. How do you diagnose and fix this?"

=== DOMAIN CURRICULUM FOR {role.upper()} ===
{domains_numbered}

Tech stack: {cfg['tech_stack_examples']}

=== CURRENT DOMAIN TO TEST (MANDATORY) ===
Domain #{next_domain_idx + 1}: {next_domain}
Difficulty: {adaptive_difficulty.upper()}
Rationale: {difficulty_rationale}

=== QUESTION STYLE ===
{type_guide}
{cfg['key_expectations']}

=== RESUME CONTEXT ===
{resume_ctx}

=== CONVERSATION SO FAR ===
{conversation_str if conversation_str else "No prior conversation. This is the very first question."}

=== QUESTIONS ALREADY ASKED (DO NOT REPEAT) ===
{', '.join(previous_questions) if previous_questions else "None yet."}

=== YOUR TASK ===
{task_block}

STRICT RULES:
1. question_text MUST start with [{next_domain}].
2. The question MUST be about "{next_domain}" only.
3. No textbook definitions — use applied scenarios, trade-offs, or real debugging situations.
4. Do not ask anything similar to questions already asked.

Return ONLY valid JSON (no markdown, no extra text):
{{
  "brief_acknowledgment": "1-2 sentence reaction to their last answer. If this is Q1, one welcome sentence only.",
  "question_text": "[{next_domain}] the actual scenario-based question here",
  "question_type": "{interview_type}",
  "domain": "{next_domain}",
  "difficulty": "{adaptive_difficulty}",
  "follow_up_hint": "what to ask if the candidate's answer is vague or incomplete"
}}
"""
    return prompt


def get_scoring_prompt(role: str, question: str, answer: str, interview_type: str) -> str:
    """Build a role-aware scoring prompt that returns rich correction data like a real interviewer."""
    cfg = get_role_config(role)
    domains_ctx = ', '.join(cfg['domains'][:4])

    return f"""You are a strict but fair technical interviewer evaluating a candidate for: {role}
Interview type: {interview_type}

Question asked: {question}
Candidate's answer: {answer}

This role requires deep expertise in: {domains_ctx}
Evaluate as a senior engineer or hiring manager would in a real interview.

=== SCORING DIMENSIONS (be strict — real interviews are tough) ===
- star_score (0-25): STAR structure quality. Penalize heavily if Action says 'we' instead of 'I', or if Result is missing.
- tech_depth_score (0-25): Technical accuracy and depth. Give 0 if the answer has factual errors or no technical content. Award full marks only for precise, correct, applied knowledge.
- comm_score (0-20): Clarity, conciseness, no filler words, no rambling.
- relevance_score (0-15): Does it directly and completely answer the question?
- confidence_score (0-10): Assertive first-person ownership. Penalize hedging ("I think maybe...", "I'm not sure but...").
- conciseness_score (0-5): 0 if <40 words. 5 if 100-400 words. 3 if 400-600. 1 if >600.
- overall_score (0-100): Weighted sum. Do NOT just add the above — calculate a holistic score.

=== CORRECTION FIELDS (critical — must be specific and factual) ===
For what_was_correct: List ONLY things that were genuinely correct. Be specific — name the exact technology, concept, or reasoning they got right.
For technical_errors: List EVERY factual mistake. Example: "Said Redis uses LRU by default — incorrect, Redis uses noeviction by default." If no errors, return empty list.
For key_concepts_missed: What important concepts should have been mentioned but weren't? Be specific to {role} and the question topic.
For interviewer_correction: Write exactly what a real interviewer would say out loud to correct and guide the candidate. Be direct, professional, and educational. 2-4 sentences. This is spoken feedback.
For ideal_answer_outline: Give a 3-5 point outline of what a strong answer to this specific question looks like. Be concrete and role-specific.

Return ONLY valid JSON (no markdown, no commentary):
{{
  "star_score": 0.0,
  "tech_depth_score": 0.0,
  "comm_score": 0.0,
  "relevance_score": 0.0,
  "confidence_score": 0.0,
  "conciseness_score": 0.0,
  "overall_score": 0.0,
  "star_feedback": {{
    "situation": "1-sentence specific feedback on how they set up the context",
    "task": "1-sentence specific feedback on how they defined their responsibility",
    "action": "1-sentence specific feedback — did they use 'I' not 'we'? Were actions concrete?",
    "result": "1-sentence specific feedback — was there a measurable outcome?"
  }},
  "what_was_correct": ["specific thing 1 they got right", "specific thing 2"],
  "technical_errors": ["error 1 with correction", "error 2 with correction"],
  "key_concepts_missed": ["important concept 1 not mentioned", "important concept 2"],
  "interviewer_correction": "What a real interviewer would say out loud to correct and guide the candidate. 2-4 sentences, spoken tone.",
  "top_strength": "1 sentence — most impressive thing about this answer, specific to {role}",
  "top_weakness": "1 sentence — most critical gap, specific and actionable",
  "filler_words": ["list", "of", "overused", "filler", "words", "found"],
  "ideal_answer_outline": "Point 1: ... | Point 2: ... | Point 3: ... | Point 4: ..."
}}
"""

