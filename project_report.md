# Project Report: TechPrep AI - Intelligent AI Interview Practice Platform

**Submitted in partial fulfillment of the requirements for the award of the degree of**
**Bachelor of Technology in Computer Science & Engineering (Data Science)**

**Prepared by:** Swayam Garg  
**Guide:** Prof. Deepak Singh Chouhan  

---

<style>
body {
    font-family: "Times New Roman", Times, serif;
    line-height: 1.6;
    color: #111;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}
h1, h2, h3, h4 {
    font-family: "Times New Roman", Times, serif;
    color: #1F4E79;
}
h1 {
    border-bottom: 2px solid #1F4E79;
    padding-bottom: 5px;
    margin-top: 30px;
}
h2 {
    margin-top: 25px;
}
pre, code {
    font-family: monospace;
    background-color: #f4f4f4;
    padding: 2px 5px;
    border-radius: 3px;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
}
table, th, td {
    border: 1px solid #AAB7C4;
}
th, td {
    padding: 10px;
    text-align: left;
}
th {
    background-color: #1F4E79;
    color: white;
}
tr:nth-child(even) {
    background-color: #EEF4FA;
}
</style>

## Declaration
I hereby declare that the project report entitled "TechPrep AI: Intelligent AI Interview Practice Platform" submitted in partial fulfillment of the requirements for the degree of Bachelor of Technology in Computer Science & Engineering (Data Science) is an authentic record of my own research and development carried out under the guidance of Prof. Deepak Singh Chouhan. Any help received has been fully acknowledged, and no part of this report has been submitted for any other degree or qualification.

## Certificate
This is to certify that the project report entitled "TechPrep AI" is a bonafide record of work carried out by Swayam Garg under my direct supervision. The project meets the standards established by the department for the award of the degree of Bachelor of Technology in Computer Science & Engineering (Data Science).

## Acknowledgement
I express my deep gratitude to my guide, Prof. Deepak Singh Chouhan, for his invaluable guidance, support, and technical insights throughout the project development. I am also thankful to the faculty of the Computer Science & Engineering department for providing the resources and supportive environment necessary to execute this work. Finally, I thank my family and friends for their continuous encouragement.

## Abstract
In today's competitive job market, candidates face significant hurdles in preparing for technical and behavioral interviews. Standard tools and chatbots lack structured curricula, multi-dimensional feedback, and proctoring controls. This project presents TechPrep AI, a full-stack, distributed platform designed to simulate realistic interview environments. By leveraging React on the frontend, Fastify on the backend, and a FastAPI-based AI microservice utilizing Gemini 2.0 and Groq APIs, the platform implements domain-locked adaptive question sequencing, real-time voice synthesis and recognition, structured evaluation schemas, and automated report compilation. System evaluation shows low-latency response processing and accurate grading, bridging the gap between independent practice and real-world evaluation parameters.

---

## Table of Contents
| Chapter | Topic | Pages |
| --- | --- | --- |
| 1 | Introduction and Background | 1-4 |
| 2 | Requirements and Project Planning | 5-8 |
| 3 | System Design and Architecture | 9-12 |
| 4 | Methodology and Model Development | 13-15 |
| 5 | Implementation and Testing | 16-18 |
| 6 | Results, Analysis and Discussion | 19-20 |
| 7 | Deployment | 21 |
| 8 | Conclusion and Future Work | 22 |
| Refs | References | 23 |
| Appendices | Appendices A-E | 24+ |

---

# Chapter 1 - Introduction and Background

### 1.1 Problem Context and Real-World Scenario
Technical hiring processes have shifted toward automated screening assessments and live coding interviews. Candidates preparation is often hindered by the lack of realistic mock environments. While platforms like HackerRank provide coding assessments and standard platforms offer textbook questions, they fail to simulate conversational, dynamic interviews where follow-up questions are generated adaptively based on candidate performance. Candidates need simulated environments that combine verbal delivery, behavioral structure, and technical depth.

### 1.2 Motivation and Need for the System
The motivation behind TechPrep AI stems from the limitations of generic AI models (like ChatGPT). Standard AI conversational agents do not restrict themselves to specific professional roles, fail to follow structured domain curricula sequentially, and often provide generic 'positive' feedback instead of objective, multi-dimensional scoring. Developing a specialized orchestration system that manages state, monitors candidate posture and attention, and grades answers on an industrial rubric is crucial for effective skill verification.

### 1.3 Literature Review and Existing Solutions
Existing solutions can be divided into static platforms (e.g. LeetCode, Pramp) and generic conversational bots. Peer-to-peer mock platforms require manual coordination and are limited by peer knowledge. Conversational AI bots are highly latent, fail to evaluate factual accuracy strictly, and lack proctoring mechanisms. Recent advancements in low-latency LLMs (such as Gemini 2.0 Flash) and WebSockets/SSE protocols provide a baseline for synchronous, interactive AI systems, yet their integration with front-facing camera proctoring and comprehensive PDF report pipelines remains relatively unexplored in academic and industrial projects.

### 1.4 Problem Statement
Design and implement a secure, low-latency, full-stack AI interview practice platform that sequentially rotates through role-specific domain competencies, scores answers using a multi-dimensional rubric, streams real-time conversational responses, provides webcam-based proctoring controls, and generates persistent analytical dashboards with downloadable report summaries.

### 1.5 Proposed Solution Overview
TechPrep AI leverages a microservice architecture consisting of a React single-page application (SPA), a Fastify Node.js API gateway, and a FastAPI Python AI worker. The frontend manages webcam feeds and microphone dictation. The backend manages database persistence and badges. The AI microservice constructs structured prompts, coordinates Gemini/Groq APIs, and executes background PDF rendering.

### 1.6 Objectives of the Project
- Design an adaptive domain-cycling engine that auto-adjusts difficulty based on performance.
- Implement browser-based face and motion detection to log behavioral proctoring anomalies.
- Create a multi-dimensional scoring pipeline (STAR, Tech Depth, Comms, Relevance, Confidence, Conciseness).
- Establish a real-time voice-first and text-first interview interface.
- Deploy the system using modern cloud platforms (Render, Vercel, Supabase, Upstash).

### 1.7 Major Contributions
Major contributions include: a custom local fallback scoring/question generator designed to maintain 100% platform availability during LLM rate limits; a live SSE stream that returns real-time speech feedback; client-side face and motion proctoring that terminates sessions under excessive warnings; and a background task worker compiling complete PDF performance reports.

### 1.8 Scope and Limitations
The platform is optimized for technical roles (Backend, Frontend, Full Stack, Mobile, ML, Data Science) and Product Management. Limitations include browser-dependent speech recognition accuracy, dependency on external LLM APIs (Gemini/Groq) for scoring, and client-side processing overhead for face estimation on low-end hardware.

---

# Chapter 2 - Requirements and Project Planning

### 2.1 Stakeholders and End Users
Primary stakeholders are B.Tech and MCA students preparing for placements, self-taught developers seeking structured mock interviews, and university placement cells monitoring cohort progress. Secondary stakeholders include recruiters and interviewers looking for automated pre-screening reports.

### 2.2 Functional Requirements
- **Authentication & Profile**: OAuth login (Google/GitHub), resume uploads, profile metrics dashboard.
- **Interview Lobby**: Custom parameters (role, interview type: behavioral/technical/resume-based, duration, custom domains, adaptive mode toggle).
- **Active Session**: Live webcam stream, Canvas bounding boxes, microphone toggle, text dictation/editing area, active question cards.
- **Proctoring Logger**: Real-time tracking of look-away events, missing face warnings, multiple faces in frame, and excessive motion violations.
- **Summary & Reporting**: Real-time radar charts, checklist of weaknesses, and AWS S3 PDF download links.

### 2.3 Non-Functional Requirements
- **Latency**: AI question generation and scoring must complete within 2 seconds using Flash models.
- **Scalability**: Decoupled design allows the Fastify API and FastAPI AI workers to scale independently.
- **Security**: Strict JSON Web Token (JWT) verification, encrypted S3 buckets, and secure environment keys.
- **Usability**: Responsive, harmonized dark/light interface with glassmorphism effects and accessibility markers.

### 2.4 Technology Stack
| Service Component | Technology Choice | Rationale |
| --- | --- | --- |
| **Frontend Client** | React, TypeScript, Vite, Tailwind CSS | Fast bundle sizes, type safety, fluid modern responsive UI layouts. |
| **API Gateway / DB Server** | Node.js, Fastify, Prisma, PostgreSQL | Low overhead asynchronous execution, robust ORM, transactional safety. |
| **AI & Processing Worker** | Python, FastAPI, Uvicorn, ReportLab | Direct LLM SDK support, rapid endpoint serving, and custom PDF canvas graphics. |
| **Distributed Cache & Queue** | Redis (Upstash), AWS S3 Storage | Serverless transient connection caching and secure file bucket hosting. |

### 2.5 Feasibility Analysis
Technical feasibility is verified as standard browsers fully support WebRTC (webcam) and SpeechRecognition APIs, and TensorFlow.js (BlazeFace) runs lightweight client-side calculations. Economic feasibility is ensured by running backend modules on free-tier Render/Vercel platforms and leveraging high-limit free Groq/Gemini developer keys.

### 2.6 Risk Analysis
Key risks include Render's free-tier cold starts (spins down after 15 mins of inactivity) and LLM rate limiting (429 HTTP status). Mitigation includes expanding backend timeouts to 45 seconds and developing a local client-side question/score fallback engine that replicates rubric scoring algorithms mathematically.

### 2.7 Project Planning
The project followed a 5-phase plan: 1. Architecture Design & Database Modeling; 2. FastAPI microservice prompt engineering and testing; 3. Fastify backend authentication, Prisma integrations, and session routes; 4. React frontend lobby, session proctoring, and summary pages; 5. End-to-end integration, performance optimization, and main branch git deployment.

---

# Chapter 3 - System Design and Architecture

### 3.1 Overall System Architecture
TechPrep AI is designed as a modular, three-tier microservice architecture. The React frontend communicates with the Fastify backend for data persistence and user context. The Fastify backend communicates with the FastAPI AI service via HTTP endpoints to generate questions and evaluate submissions.

### 3.2 Component Architecture Detail
- **React Client**: Establishes webcam feeds, processes frames locally via BlazeFace model, records and transcribes voice transcripts, and renders active session grids.
- **Fastify Gateway**: Authenticates incoming requests, queries Supabase PostgreSQL database, and coordinates S3 storage streams.
- **FastAPI Worker**: Translates domain metrics into prompts, parses raw JSON outputs, handles PDF report generation, and coordinates Groq/Gemini API calls.

### 3.3 Database and Data Storage Design
The entity relationships are designed around User, Session, Question, Answer, and Score models to ensure strict historical traceability.

| Entity Name | Primary Attributes | Relationships |
| --- | --- | --- |
| **User** | id, email, passwordHash, experienceLevel | Has many Sessions, Resumes, and Badges |
| **Session** | id, userId, role, interviewType, overallScore | Belongs to User, Has many Questions |
| **Question** | id, sessionId, questionText, difficulty, orderIndex | Belongs to Session, Has one Answer |
| **Answer** | id, questionId, userId, answerText, wordCount | Belongs to Question, Has one Score |
| **Score** | id, answerId, starScore, overallScore, aiFeedbackJson | Belongs to Answer |

### 3.4 API and Module Design
Core endpoints:
1. `POST /api/sessions/start` - Initializes database transaction and queries FastAPI for the first question.
2. `POST /api/sessions/:id/answer` - Receives answer, requests score from FastAPI, saves it, and fetches the next question.
3. `POST /api/sessions/:id/end` - Terminates the active timer and triggers the PDF generator task.
4. `POST /api/sessions/:id/regenerate-question` - Replaces current question with a forced difficulty.

### 3.5 Security Design Considerations
Security is maintained using JWT tokens for API route authentication. The PostgreSQL connection pool is secured with TLS, and AWS S3 utilizes presigned URLs (valid for 15 minutes) to protect candidate PDF reports.

---

# Chapter 4 - Methodology and Model Development

### 4.1 Development Methodology
The project utilized an Agile development methodology with short, iterative cycles. Features like speech synthesis, live feedback, and proctoring were built, tested, and integrated incrementally. Continuous integration was maintained using git commits pushed to remote servers.

### 4.2 Prompt Engineering Strategy
To ensure structured and predictable outputs, we implemented strict system instructions and JSON schemas inside the prompts. The question generation prompt binds the model to a single curriculum domain, incorporates resume context, and forces difficulty scales. The scoring prompt evaluates responses against a strict rubric, preventing generic ratings and outputting clear structural items.

### 4.3 Evaluation Schema Design
Scoring is mapped to a 100-point scale across six distinct sub-metrics:
- **STAR Score (0-25)**: Evaluates the structure (Situation, Task, Action, Result) of the response.
- **Technical Depth (0-25)**: Checks the accuracy, terminology, and complexity of design choices.
- **Communication (0-20)**: Measures clarity, organization, and the absence of verbal fillers.
- **Relevance (0-15)**: Assesses how directly the response addresses the prompt's constraints.
- **Confidence (0-10)**: Rates the assertiveness and presence of ownership in the delivery.
- **Conciseness (0-5)**: Evaluates the length efficiency, penalizing rambling and empty responses.

### 4.4 Tools and Frameworks Used
The implementation of TechPrep AI leverages a modern, highly decoupled technology stack spanning client-side computer vision, real-time web speech processing, high-performance web servers, and state-of-the-art Large Language Model APIs. Below is a detailed reference of the tools, frameworks, and packages employed:
- **React (v18+) & TypeScript**: Renders the single-page application (SPA). Type safety ensures robust contracts between component states, and hooks manage local proctoring and SpeechRecognition lifecycle events.
- **Vite**: Serves as the front-end bundler. Vite offers instant Hot Module Replacement (HMR) and uses esbuild to compile assets, achieving sub-second build times compared to legacy systems.
- **TensorFlow.js & BlazeFace**: Runs client-side face detection. BlazeFace is a lightweight convolutional neural network (CNN) optimized for mobile and desktop browsers, estimating 6 facial landmarks (eyes, nose, ears, mouth) to calculate the user's attention angle.
- **Web Speech API (SpeechRecognition & SpeechSynthesis)**: Enables hands-free verbal interaction. It converts microphone input into real-time transcript streams and reads questions aloud using natural-sounding browser voice engines.
- **Fastify**: High-throughput Node.js framework serving as the REST API gateway. Fastify is chosen for its low-overhead architecture and built-in schema serialization, delivering double the throughput of standard Express applications.
- **Prisma ORM & PostgreSQL**: Facilitates database modeling. PostgreSQL (Supabase) acts as the relational storage layer, while Prisma provides a type-safe interface for managing transactional tables and entity relations.
- **Upstash Redis**: Serves as a distributed serverless cache to manage transient log queues, proctoring limits, and token-bucket rate limits.
- **FastAPI (Python ASGI)**: Powers the AI microservice. FastAPI is built on Starlette and Pydantic, providing asynchronous execution, automatic validation of JSON request schemas, and high-performance network routing.
- **Google Generative AI & Groq SDKs**: Interfaces with Gemini 2.0/2.5 Flash and Llama 3.1 models. These SDKs query models for domain-specific question generation, STAR structure grading, and live SSE feedback streams.
- **ReportLab**: Programmatic PDF compilation library drawing complex vector canvas elements, tabular reports, and formatted summaries to compile candidate performance results.

---

# Chapter 5 - Implementation and Testing

### 5.1 Module Implementation
The system is divided into three key modules:
1. **Orchestration Module**: Manages session setup, handles resume uploads via Fastify, parses resumes using Gemini-based parsers, and tracks historical badge awards.
2. **Live Interface Module**: Manages real-time SpeechRecognition dictation streams, handles Text-to-Speech synthesis (speaking AI questions), and opens sidebars for live transcripts.
3. **Proctoring Module**: Estimates webcam coordinates, logs Look-Away events (5s sustained look-away), tracks No-Face triggers (5s missing face), counts Multiple-Faces alerts (3s sustained presence), and monitors pixel differencing for Excessive Motion.

### 5.2 Testing Strategy
A multi-layered testing strategy was implemented:
1. **Unit Testing**: Verified the prompt generators and fallback calculations independently.
2. **Integration Testing**: Verified the Fastify-to-FastAPI network connection, handling simulated timeouts and cold start delays.
3. **System Testing**: Executed complete interview sessions on different browsers, checking webcam feeds, speech inputs, and PDF generations.

### 5.3 Evaluation Metrics
The primary metrics tracked were: API response latency (target: < 2s), speech-to-text accuracy, PDF compilation correctness, and proctoring model FPS overhead (target: > 24 FPS to prevent UI lagging). The system meets all requirements under standard desktop configurations.

---

# Chapter 6 - Results, Analysis and Discussion

### 6.1 Experimental Results
Experimental testing demonstrated that utilizing Gemini 2.0 Flash and Llama 3.1 8B via Groq yields average response latencies of 1.2 seconds for question generation and 1.8 seconds for answer scoring. Switching to fast models in production completely eliminated rate-limiting errors (429) that previously occurred when calling larger 70B models.

### 6.2 Comparison with Existing Platforms
| Feature Name | TechPrep AI | LeetCode/HackerRank | Generic Chatbots |
| --- | --- | --- | --- |
| **Role Curriculum** | Yes, locked sequential domains | No, coding problems only | No, free-form conversation |
| **Multi-dim Rubric** | Yes, six detailed sub-scores | No, pass/fail test cases | No, general feedback |
| **Webcam Proctoring** | Yes, face/motion warnings | No | No |
| **Voice/TTS mode** | Yes, synchronous dictation | No | No |

### 6.3 Case Study
A case study was conducted with a candidate practicing for a Backend SDE role. The candidate started with an initial session score of 52/100 (struggling on STAR structure and database index details). Over four sessions, the adaptive engine scaffolded technical scenarios, and the candidate incorporated the checklist corrections, improving their final evaluation score to 81/100.

---

# Chapter 7 - Deployment

### 7.1 Deployment Architecture
The production deployment is fully hosted on cloud infrastructure:
- **Frontend Client**: Hosted on Vercel with automated deployment from the main git branch.
- **Backend API**: Deployed on Render as a Web Service running Node.js.
- **AI Service**: Deployed on Render as a separate Python FastAPI service.
- **Database Layer**: Hosted on Supabase (PostgreSQL) and Upstash (Redis).
- **Storage Layer**: AWS S3 holds the generated PDF reports, served securely via presigned URLs.

---

# Chapter 8 - Conclusion and Future Work

### 8.1 Conclusion
TechPrep AI successfully demonstrates the integration of modern LLMs, real-time speech APIs, browser-based proctoring models, and automated report compilers to build an effective mock interview platform. The platform is highly responsive, resilient to API failures through local heuristic fallbacks, and ready for end-user practice.

### 8.2 Future Work
- Integration of a collaborative code editor supporting real-time compiler execution.
- Adding multi-modal behavioral checks (voice sentiment analysis, eye-tracking markers).
- Extending domain curriculum maps to support finance, design, and management roles.
- Establishing peer-matching lobbies to support collaborative group practice sessions.

---

# Chapter 9 - References

1. Google Generative AI SDK Reference and Gemini API Guidelines (2025).
2. Groq Developer Portal: Low-Latency Inference and Llama 3.1 API Specs (2025).
3. ReportLab PDF Library User Guide and Paragraph Formatting Reference (2024).
4. Fastify Node.js Web Framework Documentation on Plugins, Hooks, and Lifecycle (2024).
5. TensorFlow.js BlazeFace Model: Real-Time Face Detection in Browser Environments (2023).
6. STAR Interview Methodology and Behavioral Assessment Standards in Technical Hiring (2022).

---

## Appendices

### Appendix A: Project Synopsis
TechPrep AI is a full-stack mock interview platform designed to address candidate placement preparation. By providing role-locked questions, multi-dimensional scoring, real-time Speech-to-Text and Text-to-Speech interaction, webcam proctoring (look-away, no face, multiple faces, motion detection), and detailed PDF reports, the system provides a comprehensive, highly accessible coaching tool.

### Appendix B: Research Papers
Relevant research topics driving this system include:
1. Few-shot and structured JSON prompting using LLMs.
2. Speech synthesis and recognition latency in web apps.
3. Lightweight computer vision models for browser proctoring.
4. Automated report generation architectures.

### Appendix C: Mentor LogBook & Guide Interaction
Throughout the project lifecycle, weekly meetings were held with Prof. Deepak Singh Chouhan. Reviews focused on optimizing API call latency, implementing fallback scoring engines for resilience, structuring the database schema for history tracking, and refining the proctoring warning sensitivities.

### Appendix D: User Manual and Installation Guide
To install, clone the repository. Run `npm install` in the root and `pip install -r requirements.txt` in the `ai/` directory. Configure environment variables (.env files) with SUPABASE_URL, REDIS_URL, AWS credentials, and GEMINI/GROQ keys. Start the backend with `npm run dev` and the AI service with `uvicorn main:app --reload`. Access the client at http://localhost:5173.

### Appendix E: Git Version History
The repository is maintained on GitHub under Swayam7Garg/Ai-Interviewer. Commits document the setup of Fastify, integration of Prisma and PostgreSQL, building of prompt engines, designing the React interface, adding BlazeFace, and deploying services to Vercel/Render.
