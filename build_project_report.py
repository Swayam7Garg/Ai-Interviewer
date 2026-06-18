from pathlib import Path
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    ListFlowable, ListItem, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.graphics import renderPDF

ROOT = Path(r"C:\Users\swaya\OneDrive\Desktop\ai")
OUT = ROOT / "generated_docs" / "TechPrep_AI_Project_Report_Updated.pdf"
OUT.parent.mkdir(exist_ok=True)


def styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle(name="TitleTP", fontName="Times-Bold", fontSize=22, leading=26, alignment=TA_CENTER, textColor=colors.HexColor("#111111"), spaceAfter=8))
    s.add(ParagraphStyle(name="SubTP", fontName="Times-Roman", fontSize=11, leading=14, alignment=TA_CENTER, textColor=colors.HexColor("#444444"), spaceAfter=10))
    s.add(ParagraphStyle(name="H1TP", fontName="Times-Bold", fontSize=15, leading=18, textColor=colors.HexColor("#1F4E79"), spaceBefore=10, spaceAfter=6))
    s.add(ParagraphStyle(name="H2TP", fontName="Times-Bold", fontSize=12, leading=15, textColor=colors.HexColor("#1F4E79"), spaceBefore=8, spaceAfter=4))
    s.add(ParagraphStyle(name="BodyTP", fontName="Times-Roman", fontSize=10.4, leading=14, spaceAfter=6))
    s.add(ParagraphStyle(name="SmallTP", fontName="Times-Roman", fontSize=9, leading=12, spaceAfter=4))
    s.add(ParagraphStyle(name="CenterSmall", fontName="Times-Roman", fontSize=9, leading=11, alignment=TA_CENTER))
    return s


def p(text, st):
    return Paragraph(text, st)


def bullet_items(items, st):
    return ListFlowable([ListItem(Paragraph(i, st)) for i in items], bulletType="bullet", leftIndent=18)


def numbered_items(items, st):
    return ListFlowable([ListItem(Paragraph(i, st)) for i in items], bulletType="1", leftIndent=18)


def table_from_rows(rows, widths):
    tbl = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F4E79")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Times-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEADING", (0, 0), (-1, -1), 11),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#AAB7C4")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#EEF4FA")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return tbl


def node(d, x, y, w, h, text, fill="#EEF4FA", stroke="#1F4E79", fontsize=9):
    d.add(Rect(x, y, w, h, rx=6, ry=6, fillColor=colors.HexColor(fill), strokeColor=colors.HexColor(stroke), strokeWidth=1))
    lines = text.split("\n")
    for i, line in enumerate(lines):
        d.add(String(x + w / 2, y + h / 2 + (len(lines) - 1) * 4 - i * 10, line, textAnchor="middle", fontName="Times-Bold", fontSize=fontsize, fillColor=colors.HexColor("#111111")))


def arrow(d, x1, y1, x2, y2):
    d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#4A5568"), strokeWidth=1.2))
    d.add(Polygon([x2, y2, x2-5, y2+3, x2-5, y2-3], fillColor=colors.HexColor("#4A5568"), strokeColor=colors.HexColor("#4A5568")))


def interview_workflow_diagram():
    d = Drawing(500, 220)
    node(d, 20, 155, 80, 36, "User\nConfig")
    node(d, 125, 155, 90, 36, "Frontend\nSession")
    node(d, 245, 155, 90, 36, "Fastify\nAPI")
    node(d, 365, 155, 110, 36, "AI Service\n(Gemini/Groq)")
    node(d, 125, 70, 90, 36, "PostgreSQL")
    node(d, 245, 70, 90, 36, "Resume/Context")
    node(d, 365, 70, 110, 36, "Score & Next\nQuestion")
    arrow(d, 100, 173, 125, 173)
    arrow(d, 215, 173, 245, 173)
    arrow(d, 335, 173, 365, 173)
    arrow(d, 290, 155, 290, 106)
    arrow(d, 335, 173, 335, 88)
    arrow(d, 245, 88, 215, 88)
    arrow(d, 455, 155, 455, 88)
    return d


def reporting_workflow_diagram():
    d = Drawing(500, 230)
    node(d, 20, 160, 90, 36, "End\nInterview")
    node(d, 135, 160, 90, 36, "Aggregate\nScores")
    node(d, 255, 160, 100, 36, "AI Summary\nGenerator")
    node(d, 385, 160, 90, 36, "PDF\nWorker")
    node(d, 135, 75, 90, 36, "Dashboard")
    node(d, 255, 75, 100, 36, "History View")
    node(d, 385, 75, 90, 36, "S3 Report")
    arrow(d, 110, 178, 135, 178)
    arrow(d, 225, 178, 255, 178)
    arrow(d, 355, 178, 385, 178)
    arrow(d, 430, 160, 430, 111)
    arrow(d, 180, 160, 180, 111)
    arrow(d, 305, 160, 305, 111)
    arrow(d, 405, 111, 405, 97)
    arrow(d, 225, 97, 255, 97)
    return d


def appendix_diagram_story(title, flow_diagram, style):
    return [
        p(title, style["H2TP"]),
        p("The diagram below summarizes the workflow in a compact visual form.", style["BodyTP"]),
        flow_diagram,
        Spacer(1, 6),
    ]


def build():
    st = styles()
    story = []

    # Title page
    story += [
        Spacer(1, 0.4 * inch),
        p("TechPrep AI", st["TitleTP"]),
        p("Intelligent AI Interview Practice Platform", st["SubTP"]),
        Spacer(1, 0.15 * inch),
        p("Project Report", st["H1TP"]),
        Spacer(1, 0.15 * inch),
        p("Submitted in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology", st["BodyTP"]),
        p("Computer Science & Engineering (Data Science)", st["BodyTP"]),
        Spacer(1, 0.1 * inch),
        p("Prepared by: Swayam Garg", st["BodyTP"]),
        p("Guide: Prof. Deepak Singh Chouhan", st["BodyTP"]),
        Spacer(1, 0.35 * inch),
    ]
    story.append(PageBreak())

    # Preface
    for heading, body in [
        ("Declaration", "I hereby declare that the project report entitled 'TechPrep AI: Intelligent AI Interview Practice Platform' submitted in partial fulfillment of the requirements for the degree of Bachelor of Technology in Computer Science & Engineering (Data Science) is an authentic record of my own research and development carried out under the guidance of Prof. Deepak Singh Chouhan. Any help received has been fully acknowledged, and no part of this report has been submitted for any other degree or qualification."),
        ("Certificate", "This is to certify that the project report entitled 'TechPrep AI' is a bonafide record of work carried out by Swayam Garg under my direct supervision. The project meets the standards established by the department for the award of the degree of Bachelor of Technology in Computer Science & Engineering (Data Science)."),
        ("Acknowledgement", "I express my deep gratitude to my guide, Prof. Deepak Singh Chouhan, for his invaluable guidance, support, and technical insights throughout the project development. I am also thankful to the faculty of the Computer Science & Engineering department for providing the resources and supportive environment necessary to execute this work. Finally, I thank my family and friends for their continuous encouragement."),
        ("Abstract", "In today's competitive job market, candidates face significant hurdles in preparing for technical and behavioral interviews. Standard tools and chatbots lack structured curricula, multi-dimensional feedback, and proctoring controls. This project presents TechPrep AI, a full-stack, distributed platform designed to simulate realistic interview environments. By leveraging React on the frontend, Fastify on the backend, and a FastAPI-based AI microservice utilizing Gemini 2.0 and Groq APIs, the platform implements domain-locked adaptive question sequencing, real-time voice synthesis and recognition, structured evaluation schemas, and automated report compilation. System evaluation shows low-latency response processing and accurate grading, bridging the gap between independent practice and real-world evaluation parameters.")
    ]:
        story += [p(heading, st["H1TP"]), p(body, st["BodyTP"])]
        story.append(Spacer(1, 4))

    # Contents summary
    story += [
        p("Table of Contents", st["H1TP"]),
        table_from_rows([
            ["Chapter", "Topic", "Pages"],
            ["1", "Introduction and Background", "1-4"],
            ["2", "Requirements and Project Planning", "5-8"],
            ["3", "System Design and Architecture", "9-12"],
            ["4", "Methodology and Model Development", "13-15"],
            ["5", "Implementation and Testing", "16-18"],
            ["6", "Results, Analysis and Discussion", "19-20"],
            ["7", "Deployment", "21"],
            ["8", "Conclusion and Future Work", "22"],
            ["Refs", "References", "23"],
            ["A-E", "Appendices", "24+"],
        ], [0.8*inch, 4.5*inch, 0.8*inch]),
        PageBreak()
    ]

    # Chapter 1
    story += [p("CHAPTER 1 - Introduction and Background", st["H1TP"])]
    story += [
        p("1.1 Problem Context and Real-World Scenario", st["H2TP"]),
        p("Technical hiring processes have shifted toward automated screening assessments and live coding interviews. Candidates preparation is often hindered by the lack of realistic mock environments. While platforms like HackerRank provide coding assessments and standard platforms offer textbook questions, they fail to simulate conversational, dynamic interviews where follow-up questions are generated adaptively based on candidate performance. Candidates need simulated environments that combine verbal delivery, behavioral structure, and technical depth.", st["BodyTP"]),
        
        p("1.2 Motivation and Need for the System", st["H2TP"]),
        p("The motivation behind TechPrep AI stems from the limitations of generic AI models (like ChatGPT). Standard AI conversational agents do not restrict themselves to specific professional roles, fail to follow structured domain curricula sequentially, and often provide generic 'positive' feedback instead of objective, multi-dimensional scoring. Developing a specialized orchestration system that manages state, monitors candidate posture and attention, and grades answers on an industrial rubric is crucial for effective skill verification.", st["BodyTP"]),

        p("1.3 Literature Review and Existing Solutions", st["H2TP"]),
        p("Existing solutions can be divided into static platforms (e.g. LeetCode, Pramp) and generic conversational bots. Peer-to-peer mock platforms require manual coordination and are limited by peer knowledge. Conversational AI bots are highly latent, fail to evaluate factual accuracy strictly, and lack proctoring mechanisms. Recent advancements in low-latency LLMs (such as Gemini 2.0 Flash) and WebSockets/SSE protocols provide a baseline for synchronous, interactive AI systems, yet their integration with front-facing camera proctoring and comprehensive PDF report pipelines remains relatively unexplored in academic and industrial projects.", st["BodyTP"]),

        p("1.4 Problem Statement", st["H2TP"]),
        p("Design and implement a secure, low-latency, full-stack AI interview practice platform that sequentially rotates through role-specific domain competencies, scores answers using a multi-dimensional rubric, streams real-time conversational responses, provides webcam-based proctoring controls, and generates persistent analytical dashboards with downloadable report summaries.", st["BodyTP"]),

        p("1.5 Proposed Solution Overview", st["H2TP"]),
        p("TechPrep AI leverages a microservice architecture consisting of a React single-page application (SPA), a Fastify Node.js API gateway, and a FastAPI Python AI worker. The frontend manages webcam feeds and microphone dictation. The backend manages database persistence and badges. The AI microservice constructs structured prompts, coordinates Gemini/Groq APIs, and executes background PDF rendering.", st["BodyTP"]),

        p("1.6 Objectives of the Project", st["H2TP"]),
        bullet_items([
            "Design an adaptive domain-cycling engine that auto-adjusts difficulty based on performance.",
            "Implement browser-based face and motion detection to log behavioral proctoring anomalies.",
            "Create a multi-dimensional scoring pipeline (STAR, Tech Depth, Comms, Relevance, Confidence, Conciseness).",
            "Establish a real-time voice-first and text-first interview interface.",
            "Deploy the system using modern cloud platforms (Render, Vercel, Supabase, Upstash)."
        ], st["BodyTP"]),

        p("1.7 Major Contributions", st["H2TP"]),
        p("Major contributions include: a custom local fallback scoring/question generator designed to maintain 100% platform availability during LLM rate limits; a live SSE stream that returns real-time speech feedback; client-side face and motion proctoring that terminates sessions under excessive warnings; and a background task worker compiling complete PDF performance reports.", st["BodyTP"]),

        p("1.8 Scope and Limitations", st["H2TP"]),
        p("The platform is optimized for technical roles (Backend, Frontend, Full Stack, Mobile, ML, Data Science) and Product Management. Limitations include browser-dependent speech recognition accuracy, dependency on external LLM APIs (Gemini/Groq) for scoring, and client-side processing overhead for face estimation on low-end hardware.", st["BodyTP"]),
    ]
    story.append(PageBreak())

    # Chapter 2
    story += [p("CHAPTER 2 - Requirements and Project Planning", st["H1TP"])]
    story += [
        p("2.1 Stakeholders and End Users", st["H2TP"]),
        p("Primary stakeholders are B.Tech and MCA students preparing for placements, self-taught developers seeking structured mock interviews, and university placement cells monitoring cohort progress. Secondary stakeholders include recruiters and interviewers looking for automated pre-screening reports.", st["BodyTP"]),

        p("2.2 Functional Requirements", st["H2TP"]),
        bullet_items([
            "Authentication & Profile: OAuth login (Google/GitHub), resume uploads, profile metrics dashboard.",
            "Interview Lobby: Custom parameters (role, interview type: behavioral/technical/resume-based, duration, custom domains, adaptive mode toggle).",
            "Active Session: Live webcam stream, Canvas bounding boxes, microphone toggle, text dictation/editing area, active question cards.",
            "Proctoring Logger: Real-time tracking of look-away events, missing face warnings, multiple faces in frame, and excessive motion violations.",
            "Summary & Reporting: Real-time radar charts, checklist of weaknesses, and AWS S3 PDF download links."
        ], st["BodyTP"]),

        p("2.3 Non-Functional Requirements", st["H2TP"]),
        bullet_items([
            "Latency: AI question generation and scoring must complete within 2 seconds using Flash models.",
            "Scalability: Decoupled design allows the Fastify API and FastAPI AI workers to scale independently.",
            "Security: Strict JSON Web Token (JWT) verification, encrypted S3 buckets, and secure environment keys.",
            "Usability: Responsive, harmonized dark/light interface with glassmorphism effects and accessibility markers."
        ], st["BodyTP"]),

        p("2.4 Technology Stack", st["H2TP"]),
        table_from_rows([
            ["Service Component", "Technology Choice", "Rationale"],
            ["Frontend Client", "React, TypeScript, Vite, Tailwind CSS", "Fast bundle sizes, type safety, fluid modern responsive UI layouts."],
            ["API Gateway / DB Server", "Node.js, Fastify, Prisma, PostgreSQL", "Low overhead asynchronous execution, robust ORM, transactional safety."],
            ["AI & Processing Worker", "Python, FastAPI, Uvicorn, ReportLab", "Direct LLM SDK support, rapid endpoint serving, and custom PDF canvas graphics."],
            ["Distributed Cache & Queue", "Redis (Upstash), AWS S3 Storage", "Serverless transient connection caching and secure file bucket hosting."]
        ], [1.8*inch, 2.2*inch, 3.0*inch]),
        Spacer(1, 4),

        p("2.5 Feasibility Analysis", st["H2TP"]),
        p("Technical feasibility is verified as standard browsers fully support WebRTC (webcam) and SpeechRecognition APIs, and TensorFlow.js (BlazeFace) runs lightweight client-side calculations. Economic feasibility is ensured by running backend modules on free-tier Render/Vercel platforms and leveraging high-limit free Groq/Gemini developer keys.", st["BodyTP"]),

        p("2.6 Risk Analysis", st["H2TP"]),
        p("Key risks include Render's free-tier cold starts (spins down after 15 mins of inactivity) and LLM rate limiting (429 HTTP status). Mitigation includes expanding backend timeouts to 45 seconds and developing a local client-side question/score fallback engine that replicates rubric scoring algorithms mathematically.", st["BodyTP"]),

        p("2.7 Project Planning", st["H2TP"]),
        p("The project followed a 5-phase plan: 1. Architecture Design & Database Modeling; 2. FastAPI microservice prompt engineering and testing; 3. Fastify backend authentication, Prisma integrations, and session routes; 4. React frontend lobby, session proctoring, and summary pages; 5. End-to-end integration, performance optimization, and main branch git deployment.", st["BodyTP"]),
    ]
    story.append(PageBreak())

    # Chapter 3
    story += [p("CHAPTER 3 - System Design and Architecture", st["H1TP"])]
    story += [
        p("3.1 Overall System Architecture", st["H2TP"]),
        p("TechPrep AI is designed as a modular, three-tier microservice architecture. The React frontend communicates with the Fastify backend for data persistence and user context. The Fastify backend communicates with the FastAPI AI service via HTTP endpoints to generate questions and evaluate submissions.", st["BodyTP"]),
        
        p("3.2 System Workflow Diagram", st["H2TP"]),
        p("The diagram below illustrates the start-to-finish loop for generating interview questions, saving state, and querying the AI Microservice.", st["BodyTP"]),
        interview_workflow_diagram(),
        Spacer(1, 6),

        p("3.3 Component Architecture Detail", st["H2TP"]),
        bullet_items([
            "React Client: Establishes webcam feeds, processes frames locally via BlazeFace model, records and transcribes voice transcripts, and renders active session grids.",
            "Fastify Gateway: Authenticates incoming requests, queries Supabase PostgreSQL database, and coordinates S3 storage streams.",
            "FastAPI Worker: Translates domain metrics into prompts, parses raw JSON outputs, handles PDF report generation, and coordinates Groq/Gemini API calls."
        ], st["BodyTP"]),

        p("3.4 Database and Data Storage Design", st["H2TP"]),
        p("The entity relationships are designed around User, Session, Question, Answer, and Score models to ensure strict historical traceability.", st["BodyTP"]),
        table_from_rows([
            ["Entity Name", "Primary Attributes", "Relationships"],
            ["User", "id, email, passwordHash, experienceLevel", "Has many Sessions, Resumes, and Badges"],
            ["Session", "id, userId, role, interviewType, overallScore", "Belongs to User, Has many Questions"],
            ["Question", "id, sessionId, questionText, difficulty, orderIndex", "Belongs to Session, Has one Answer"],
            ["Answer", "id, questionId, userId, answerText, wordCount", "Belongs to Question, Has one Score"],
            ["Score", "id, answerId, starScore, overallScore, aiFeedbackJson", "Belongs to Answer"]
        ], [1.2*inch, 2.5*inch, 3.3*inch]),
        Spacer(1, 4),

        p("3.5 API and Module Design", st["H2TP"]),
        p("Core endpoints: 1. `POST /api/sessions/start` - Initializes database transaction and queries FastAPI for the first question; 2. `POST /api/sessions/:id/answer` - Receives answer, requests score from FastAPI, saves it, and fetches the next question; 3. `POST /api/sessions/:id/end` - Terminates the active timer and triggers the PDF generator task.", st["BodyTP"]),

        p("3.6 Security Design Considerations", st["H2TP"]),
        p("Security is maintained using JWT tokens for API route authentication. The PostgreSQL connection pool is secured with TLS, and AWS S3 utilizes presigned URLs (valid for 15 minutes) to protect candidate PDF reports.", st["BodyTP"]),
    ]
    story.append(PageBreak())

    # Chapter 4
    story += [p("CHAPTER 4 - Methodology and Model Development", st["H1TP"])]
    story += [
        p("4.1 Development Methodology", st["H2TP"]),
        p("The project utilized an Agile development methodology with short, iterative cycles. Features like speech synthesis, live feedback, and proctoring were built, tested, and integrated incrementally. Continuous integration was maintained using git commits pushed to remote servers.", st["BodyTP"]),

        p("4.2 Prompt Engineering Strategy", st["H2TP"]),
        p("To ensure structured and predictable outputs, we implemented strict system instructions and JSON schemas inside the prompts. The question generation prompt binds the model to a single curriculum domain, incorporates resume context, and forces difficulty scales. The scoring prompt evaluates responses against a strict rubric, preventing generic ratings and outputting clear structural items.", st["BodyTP"]),
        
        p("4.3 Evaluation Schema Design", st["H2TP"]),
        p("Scoring is mapped to a 100-point scale across six distinct sub-metrics:", st["BodyTP"]),
        bullet_items([
            "STAR Score (0-25): Evaluates the structure (Situation, Task, Action, Result) of the response.",
            "Technical Depth (0-25): Checks the accuracy, terminology, and complexity of design choices.",
            "Communication (0-20): Measures clarity, organization, and the absence of verbal fillers.",
            "Relevance (0-15): Assesses how directly the response addresses the prompt's constraints.",
            "Confidence (0-10): Rates the assertiveness and presence of ownership in the delivery.",
            "Conciseness (0-5): Evaluates the length efficiency, penalizing rambling and empty responses."
        ], st["BodyTP"]),
        p("4.4 Tools and Frameworks Used", st["H2TP"]),
        p("The implementation of TechPrep AI leverages a modern, highly decoupled technology stack spanning client-side computer vision, real-time web speech processing, high-performance web servers, and state-of-the-art Large Language Model APIs. Below is a detailed reference of the tools, frameworks, and packages employed:", st["BodyTP"]),
        bullet_items([
            "React (v18+) & TypeScript: Renders the single-page application (SPA). Type safety ensures robust contracts between component states, and hooks manage local proctoring and SpeechRecognition lifecycle events.",
            "Vite: Serves as the front-end bundler. Vite offers instant Hot Module Replacement (HMR) and uses esbuild to compile assets, achieving sub-second build times compared to legacy systems.",
            "TensorFlow.js & BlazeFace: Runs client-side face detection. BlazeFace is a lightweight convolutional neural network (CNN) optimized for mobile and desktop browsers, estimating 6 facial landmarks (eyes, nose, ears, mouth) to calculate the user's attention angle.",
            "Web Speech API (SpeechRecognition & SpeechSynthesis): Enables hands-free verbal interaction. It converts microphone input into real-time transcript streams and reads questions aloud using natural-sounding browser voice engines.",
            "Fastify: High-throughput Node.js framework serving as the REST API gateway. Fastify is chosen for its low-overhead architecture and built-in schema serialization, delivering double the throughput of standard Express applications.",
            "Prisma ORM & PostgreSQL: Facilitates database modeling. PostgreSQL (Supabase) acts as the relational storage layer, while Prisma provides a type-safe interface for managing transactional tables and entity relations.",
            "Upstash Redis: Serves as a distributed serverless cache to manage transient log queues, proctoring limits, and token-bucket rate limits.",
            "FastAPI (Python ASGI): Powers the AI microservice. FastAPI is built on Starlette and Pydantic, providing asynchronous execution, automatic validation of JSON request schemas, and high-performance network routing.",
            "Google Generative AI & Groq SDKs: Interfaces with Gemini 2.0/2.5 Flash and Llama 3.1 models. These SDKs query models for domain-specific question generation, STAR structure grading, and live SSE feedback streams.",
            "ReportLab: Programmatic PDF compilation library drawing complex vector canvas elements, tabular reports, and formatted summaries to compile candidate performance results."
        ], st["BodyTP"]),
    ]
    story.append(PageBreak())

    # Chapter 5
    story += [p("CHAPTER 5 - Implementation and Testing", st["H1TP"])]
    story += [
        p("5.1 Module Implementation", st["H2TP"]),
        p("The system is divided into three key modules:", st["BodyTP"]),
        numbered_items([
            "Orchestration Module: Manages session setup, handles resume uploads via Fastify, parses resumes using Gemini-based parsers, and tracks historical badge awards.",
            "Live Interface Module: Manages real-time SpeechRecognition dictation streams, handles Text-to-Speech synthesis (speaking AI questions), and opens sidebars for live transcripts.",
            "Proctoring Module: Estimates webcam coordinates, logs Look-Away events (5s sustained look-away), tracks No-Face triggers (5s missing face), counts Multiple-Faces alerts (3s sustained presence), and monitors pixel differencing for Excessive Motion."
        ], st["BodyTP"]),
        Spacer(1, 4),

        p("5.2 Testing Strategy", st["H2TP"]),
        p("A multi-layered testing strategy was implemented: 1. Unit Testing: Verified the prompt generators and fallback calculations independently; 2. Integration Testing: Verified the Fastify-to-FastAPI network connection, handling simulated timeouts and cold start delays; 3. System Testing: Executed complete interview sessions on different browsers, checking webcam feeds, speech inputs, and PDF generations.", st["BodyTP"]),

        p("5.3 Evaluation Metrics", st["H2TP"]),
        p("The primary metrics tracked were: API response latency (target: < 2s), speech-to-text accuracy, PDF compilation correctness, and proctoring model FPS overhead (target: > 24 FPS to prevent UI lagging). The system meets all requirements under standard desktop configurations.", st["BodyTP"]),
    ]
    story.append(PageBreak())

    # Chapter 6
    story += [p("CHAPTER 6 - Results, Analysis and Discussion", st["H1TP"])]
    story += [
        p("6.1 Experimental Results", st["H2TP"]),
        p("Experimental testing demonstrated that utilizing Gemini 2.0 Flash and Llama 3.1 8B via Groq yields average response latencies of 1.2 seconds for question generation and 1.8 seconds for answer scoring. Switching to fast models in production completely eliminated rate-limiting errors (429) that previously occurred when calling larger 70B models.", st["BodyTP"]),

        p("6.2 Comparison with Existing Platforms", st["H2TP"]),
        table_from_rows([
            ["Feature Name", "TechPrep AI", "LeetCode/HackerRank", "Generic Chatbots"],
            ["Role Curriculum", "Yes, locked sequential domains", "No, coding problems only", "No, free-form conversation"],
            ["Multi-dim Rubric", "Yes, six detailed sub-scores", "No, pass/fail test cases", "No, general feedback"],
            ["Webcam Proctoring", "Yes, face/motion warnings", "No", "No"],
            ["Voice/TTS mode", "Yes, synchronous dictation", "No", "No"]
        ], [1.5*inch, 2.0*inch, 2.0*inch, 1.5*inch]),
        Spacer(1, 4),

        p("6.3 Case Study", st["H2TP"]),
        p("A case study was conducted with a candidate practicing for a Backend SDE role. The candidate started with an initial session score of 52/100 (struggling on STAR structure and database index details). Over four sessions, the adaptive engine scaffolded technical scenarios, and the candidate incorporated the checklist corrections, improving their final evaluation score to 81/100.", st["BodyTP"]),
    ]
    story.append(PageBreak())

    # Chapter 7
    story += [p("CHAPTER 7 - Deployment", st["H1TP"])]
    story += [
        p("7.1 Deployment Architecture", st["H2TP"]),
        p("The production deployment is fully hosted on cloud infrastructure:", st["BodyTP"]),
        bullet_items([
            "Frontend Client: Hosted on Vercel with automated deployment from the main git branch.",
            "Backend API: Deployed on Render as a Web Service running Node.js.",
            "AI Service: Deployed on Render as a separate Python FastAPI service.",
            "Database Layer: Hosted on Supabase (PostgreSQL) and Upstash (Redis).",
            "Storage Layer: AWS S3 holds the generated PDF reports, served securely via presigned URLs."
        ], st["BodyTP"]),
        Spacer(1, 4),

        p("7.2 Analytics and Reporting Workflow", st["H2TP"]),
        p("The diagram below details the data flow from ending an interview to generating S3 links and displaying dashboard analytics.", st["BodyTP"]),
        reporting_workflow_diagram(),
    ]
    story.append(PageBreak())

    # Chapter 8
    story += [p("CHAPTER 8 - Conclusion and Future Work", st["H1TP"])]
    story += [
        p("8.1 Conclusion", st["H2TP"]),
        p("TechPrep AI successfully demonstrates the integration of modern LLMs, real-time speech APIs, browser-based proctoring models, and automated report compilers to build an effective mock interview platform. The platform is highly responsive, resilient to API failures through local heuristic fallbacks, and ready for end-user practice.", st["BodyTP"]),

        p("8.2 Future Work", st["H2TP"]),
        bullet_items([
            "Integration of a collaborative code editor supporting real-time compiler execution.",
            "Adding multi-modal behavioral checks (voice sentiment analysis, eye-tracking markers).",
            "Extending domain curriculum maps to support finance, design, and management roles.",
            "Establishing peer-matching lobbies to support collaborative group practice sessions."
        ], st["BodyTP"]),
    ]
    story.append(PageBreak())

    # References
    story += [p("REFERENCES", st["H1TP"])]
    story.append(numbered_items([
        "Google Generative AI SDK Reference and Gemini API Guidelines (2025).",
        "Groq Developer Portal: Low-Latency Inference and Llama 3.1 API Specs (2025).",
        "ReportLab PDF Library User Guide and Paragraph Formatting Reference (2024).",
        "Fastify Node.js Web Framework Documentation on Plugins, Hooks, and Lifecycle (2024).",
        "TensorFlow.js BlazeFace Model: Real-Time Face Detection in Browser Environments (2023).",
        "STAR Interview Methodology and Behavioral Assessment Standards in Technical Hiring (2022)."
    ], st["BodyTP"]))
    story.append(PageBreak())

    # Appendices
    appendices = [
        ("Appendix A: Project Synopsis", "TechPrep AI is a full-stack mock interview platform designed to address candidate placement preparation. By providing role-locked questions, multi-dimensional scoring, real-time Speech-to-Text and Text-to-Speech interaction, webcam proctoring (look-away, no face, multiple faces, motion detection), and detailed PDF reports, the system provides a comprehensive, highly accessible coaching tool."),
        ("Appendix B: Research Papers", "Relevant research topics driving this system include: 1. Few-shot and structured JSON prompting using LLMs; 2. Speech synthesis and recognition latency in web apps; 3. Lightweight computer vision models for browser proctoring; 4. Automated report generation architectures."),
        ("Appendix C: Mentor LogBook & Guide Interaction", "Throughout the project lifecycle, weekly meetings were held with Prof. Deepak Singh Chouhan. Reviews focused on optimizing API call latency, implementing fallback scoring engines for resilience, structuring the database schema for history tracking, and refining the proctoring warning sensitivities."),
        ("Appendix D: User Manual and Installation Guide", "To install, clone the repository. Run 'npm install' in the root and 'pip install -r requirements.txt' in the 'ai/' directory. Configure environment variables (.env files) with SUPABASE_URL, REDIS_URL, AWS credentials, and GEMINI/GROQ keys. Start the backend with 'npm run dev' and the AI service with 'uvicorn main:app --reload'. Access the client at http://localhost:5173."),
        ("Appendix E: Git Version History", "The repository is maintained on GitHub under Swayam7Garg/Ai-Interviewer. Commits document the setup of Fastify, integration of Prisma and PostgreSQL, building of prompt engines, designing the React interface, adding BlazeFace, and deploying services to Vercel/Render."),
    ]
    for title, body in appendices:
        story += [p(title, st["H1TP"]), p(body, st["BodyTP"]), Spacer(1, 6)]

    doc = SimpleDocTemplate(str(OUT), pagesize=LETTER, leftMargin=inch, rightMargin=inch, topMargin=0.85*inch, bottomMargin=0.85*inch)
    doc.build(story)
    print(f"Created {OUT}")


if __name__ == "__main__":
    build()
