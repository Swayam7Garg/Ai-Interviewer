# ACROPOLIS INSTITUTE OF TECHNOLOGY AND RESEARCH
### Department of Computer Science & Engineering (Data Science)

---

# SYNOPSIS
### On
## TECHPREP AI: INTELLIGENT AI INTERVIEW PRACTICE PLATFORM

---

### 1. INTRODUCTION

#### 1.1 Overview
In the contemporary technical recruitment landscape, candidates face high performance bars spanning technical execution, system design knowledge, and behavioral articulation. Traditional preparation platforms provide static practice sets (e.g., coding problems on LeetCode or static list questionnaires) but fail to replicate the dynamic, conversational, and multi-disciplinary experience of a live human interview. 

**TechPrep AI** is an intelligent, low-latency, full-stack mock interview platform designed to address these gaps. The system integrates real-time browser-based voice interaction, automated proctoring assessments, and domain-locked adaptive question sequencing. Utilizing a decoupled three-tier architecture, the platform comprises a responsive React client, a high-throughput Fastify API gateway, and a cognitive FastAPI service powered by state-of-the-art Large Language Models (Gemini 2.0 Flash and Llama 3.1 via Groq). During an active session, the candidate is prompted verbally via Text-to-Speech (TTS), responds verbally through automated Speech-to-Text (STT) transcription, and is monitored for behavioral integrity using a client-side computer vision model (TensorFlow.js BlazeFace) that flags look-away, multiple faces, and motion violations.

#### 1.2 Purpose
The core purpose of TechPrep AI is to democratize high-fidelity placement preparation and interview coaching. The key goals achieved by the platform include:
* **Dynamic Conversational Practice**: Bridges the gap between static text inputs and verbal articulation by forcing candidates to formulate answers aloud within structured timing windows.
* **Objective, Metric-Based Feedback**: Evaluates student responses across a comprehensive, industrial grading rubric (STAR structure, technical depth, communication, relevance, confidence, and conciseness) to produce quantitative scores out of 100.
* **Low-Cost Integrity Verification**: Provides lightweight, client-side, browser-native proctoring that detects visual cheating anomalies without requiring intrusive kernel-level desktop installations.
* **Institutional Placement Analytics**: Empowers university placement coordinators and recruiters to track cohort performance, identify skill gaps, and review automated PDF candidate reports stored in AWS S3 buckets.

---

### 2. LITERATURE SURVEY

#### 2.1 Existing Problem
Current placement preparation paradigms suffer from three primary limitations:
1. **Lack of Conversational Dynamics**: Traditional coding sites evaluate syntax and test cases but ignore verbal structure, communication quality, and behavioral articulation (e.g., the STAR method).
2. **Inadequacy of Generic Chatbots**: Conversational tools (such as ChatGPT) provide generic, overly positive feedback, fail to enforce domain-locked curricula (often drifting off-topic), and lack chronological session memory constraints.
3. **Proctoring and Accessibility Barriers**: Automated remote assessments are highly vulnerable to proxy candidates and split-screen note referencing. Existing proctoring software requires heavy downloads that degrade performance on standard student hardware.

#### 2.2 Proposed Solution
TechPrep AI addresses these issues through a specialized orchestration layer and client-side computer vision:
* **Contextual Domain Cycling**: A state-machine tracks historical questions, resume keywords, and domain competencies to generate logical, adaptive follow-up questions that push candidates to their technical limits.
* **Hybrid Model Execution**: Employs low-latency models (`gemini-2.0-flash`) for responsive, sub-second question generation and high-fidelity models (`gemini-1.5-flash` or `llama-3.1-70b`) asynchronously for deeper rubric grading.
* **Client-Side Face Tracking**: Uses TensorFlow.js BlazeFace locally in the browser. Landmark estimations compute eye-nose coordinates to determine attention vectors, executing proctoring loops at 30 FPS without server overhead.

---

### 3. THEORETICAL ANALYSIS

#### 3.1 Block Diagram
The diagram below illustrates the structural dependencies, protocol interfaces, and data flow of the TechPrep AI platform:

```mermaid
graph TD
    subgraph Client Tier (React & Browser APIs)
        A[React UI Client] <-->|Web Speech API| B[Speech Recognition & TTS]
        A <-->|Canvas API| C[TensorFlow.js BlazeFace Model]
    end

    subgraph Logic & Gateway Tier (Fastify Server)
        D[Fastify REST API] <-->|JWT / JSON payloads| A
        E[Prisma Client] <-->|SSL Connection| F[(Supabase PostgreSQL)]
        D <--> E
    end

    subgraph Asynchronous Processing Tier
        G[Upstash Redis Queue] <-->|Pub/Sub Events| D
        H[FastAPI AI microservice] <-->|Request/Response| D
        I[ReportLab PDF Compiler] -->|Upload File| J[AWS S3 Storage]
        H <--> I
    end

    subgraph LLM Cognitive Tier
        H <-->|HTTPS API calls| K[Google Gemini API]
        H <-->|HTTPS API calls| L[Groq Llama 3.1 API]
    end
```

#### 3.2 Hardware/Software Designing

##### Hardware Requirements
* **Hosting Environment (Server)**:
  * CPU: 1 vCPU (minimum)
  * RAM: 512 MB (minimum)
  * Disk Space: 10 GB SSD
* **User Environment (Client)**:
  * CPU: Dual-Core processor (Intel i3 / AMD Ryzen 3 or higher)
  * RAM: 4 GB
  * Bounding Capture Devices: 720p Webcam and high-quality microphone
  * Network: Broadband internet connection (minimum 5 Mbps download/upload)

##### Software Requirements
* **Operating System**: Windows 10/11, macOS (v12+), or Linux (Ubuntu 20.04+)
* **Database Management System**: PostgreSQL (v15+)
* **Caching & Queue Layer**: Redis (Serverless Upstash)
* **Development Runtimes**: Node.js (v18.x or higher) and Python (v3.10.x or higher)
* **Core Libraries & Frameworks**:
  * Frontend: React (v18.x), Vite, Tailwind CSS, TensorFlow.js, BlazeFace
  * Backend API: Fastify (Node.js), Prisma ORM
  * AI Service: FastAPI (Python), Uvicorn ASGI server
  * PDF compiler: ReportLab PDF Library

---

### 4. APPLICATIONS

TechPrep AI provides a versatile utility layer that can be applied across several sectors:
* **Academic Institutions**: B.Tech, MCA, and MBA colleges can integrate the system into placement cells to host mock practice camps, compiling cohort analytics to target critical soft and hard skill deficiencies.
* **Corporate Recruitment Pipelines**: Companies can deploy the platform as a cost-efficient pre-screening filter to screen candidate speaking structure and technical accuracy before scheduling synchronous interviews.
* **Online Coding Academies & Bootcamps**: Ed-tech bootcamps can embed this software to prepare students for career transitions, offering automated mock sessions aligned directly with their course curricula.
* **Self-Paced Career Development**: Individual job seekers can run mock sessions configured for specific companies, utilizing the resume parser to test their experience against specific job requirements.

---

### REFERENCES

1. **Google Generative AI Developer Guides**: API references and schema enforcement details for Gemini 2.0 Flash and Gemini 1.5 Pro (2025).
2. **Groq Llama 3.1 Inference Guidelines**: Low-latency execution, token budgeting, and system instructions optimization (2025).
3. **TensorFlow.js BlazeFace Model**: Bazrev, V. et al. "BlazeFace: Sub-millisecond Face Detector on Mobile GPUs" (arXiv:1907.05047, 2019).
4. **ReportLab PDF User Guide**: Dynamic document templates, Flowables layout specifications, and vector shapes drawing (2024).
5. **Fastify Framework Reference**: Schema parsing, JSON validation hook sequences, and performance optimization (2024).

---

### ADMINISTRATIVE DETAILS

**Internal Guide**:  
Prof. Deepak Singh Chouhan  
Department of CSE(DS)  
Acropolis Institute of Technology and Research  

**External Guide**:  
Mr./Ms. _____________  
(Industry Sponsor / Coordinator)  

**Group Members**:  
1. Swayam Garg (Enrollment No. 0111CS221193)  
2. __________________________________ (Enrollment No. ________________)  
3. __________________________________ (Enrollment No. ________________)  
4. __________________________________ (Enrollment No. ________________)  

*Note: Limit the synopsis to maximum 6-8 pages.*
