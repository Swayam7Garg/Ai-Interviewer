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

ROOT = Path(r"C:\Users\swaya\OneDrive\Desktop\ai")
OUT = ROOT / "generated_docs" / "TechPrep_AI_Synopsis.pdf"
OUT.parent.mkdir(exist_ok=True)


def styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle(name="TitleAITR", fontName="Times-Bold", fontSize=16, leading=20, alignment=TA_CENTER, textColor=colors.HexColor("#111111"), spaceAfter=6))
    s.add(ParagraphStyle(name="SubAITR", fontName="Times-Roman", fontSize=11, leading=14, alignment=TA_CENTER, textColor=colors.HexColor("#333333"), spaceAfter=12))
    s.add(ParagraphStyle(name="HeaderAITR", fontName="Times-Bold", fontSize=13, leading=16, alignment=TA_CENTER, spaceAfter=15))
    s.add(ParagraphStyle(name="H1AITR", fontName="Times-Bold", fontSize=12, leading=15, textColor=colors.HexColor("#1F4E79"), spaceBefore=10, spaceAfter=6))
    s.add(ParagraphStyle(name="H2AITR", fontName="Times-Bold", fontSize=10.5, leading=13, textColor=colors.HexColor("#1F4E79"), spaceBefore=8, spaceAfter=4))
    s.add(ParagraphStyle(name="BodyAITR", fontName="Times-Roman", fontSize=10, leading=13.5, spaceAfter=5))
    s.add(ParagraphStyle(name="SignBody", fontName="Times-Roman", fontSize=9.5, leading=13))
    s.add(ParagraphStyle(name="SignBold", fontName="Times-Bold", fontSize=9.5, leading=13))
    return s


def p(text, st):
    return Paragraph(text, st)


def bullet_items(items, st):
    return ListFlowable([ListItem(Paragraph(i, st)) for i in items], bulletType="bullet", leftIndent=18)


def numbered_items(items, st):
    return ListFlowable([ListItem(Paragraph(i, st)) for i in items], bulletType="1", leftIndent=18)


def table_from_rows(rows, widths):
    tbl = Table(rows, colWidths=widths, hAlign="LEFT")
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F4E79")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Times-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEADING", (0, 0), (-1, -1), 11),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#AAB7C4")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#EEF4FA")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return tbl


def node(d, x, y, w, h, text, fill="#EEF4FA", stroke="#1F4E79", fontsize=8.5):
    d.add(Rect(x, y, w, h, rx=5, ry=5, fillColor=colors.HexColor(fill), strokeColor=colors.HexColor(stroke), strokeWidth=1))
    lines = text.split("\n")
    for i, line in enumerate(lines):
        d.add(String(x + w / 2, y + h / 2 + (len(lines) - 1) * 4 - i * 10, line, textAnchor="middle", fontName="Times-Bold", fontSize=fontsize, fillColor=colors.HexColor("#111111")))


def arrow(d, x1, y1, x2, y2):
    d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#4A5568"), strokeWidth=1.1))
    if x1 == x2:  # vertical
        dy = 4 if y2 > y1 else -4
        d.add(Polygon([x2, y2, x2-3, y2-dy, x2+3, y2-dy], fillColor=colors.HexColor("#4A5568"), strokeColor=colors.HexColor("#4A5568")))
    else:  # horizontal
        dx = 4 if x2 > x1 else -4
        d.add(Polygon([x2, y2, x2-dx, y2-3, x2-dx, y2+3], fillColor=colors.HexColor("#4A5568"), strokeColor=colors.HexColor("#4A5568")))


def block_diagram():
    d = Drawing(480, 160)
    # Row 1 (y = 100)
    node(d, 10, 100, 130, 36, "React Client\n(Web Speech, BlazeFace)")
    node(d, 175, 100, 110, 36, "Fastify API Gateway\n(Prisma ORM)")
    node(d, 320, 100, 150, 36, "FastAPI AI Microservice\n(Prompt Orchestrator)")
    
    # Row 2 (y = 15)
    node(d, 175, 15, 110, 36, "Supabase PostgreSQL\n& Upstash Redis")
    node(d, 320, 15, 150, 36, "LLM APIs\n(Gemini 2.0, Groq Llama)")
    
    # Connecting Arrows
    # Client <--> Gateway
    arrow(d, 140, 122, 175, 122)
    arrow(d, 175, 114, 140, 114)
    
    # Gateway <--> AI Microservice
    arrow(d, 285, 122, 320, 122)
    arrow(d, 320, 114, 285, 114)
    
    # Gateway <--> DB
    arrow(d, 222, 100, 222, 51)
    arrow(d, 238, 51, 238, 100)
    
    # AI Microservice <--> LLM APIs
    arrow(d, 385, 100, 385, 51)
    arrow(d, 405, 51, 405, 100)
    return d


def build():
    st = styles()
    story = []

    # Title Banner Block
    story += [
        p("ACROPOLIS INSTITUTE OF TECHNOLOGY AND RESEARCH", st["TitleAITR"]),
        p("Department of IT, CSE(DS)", st["SubAITR"]),
        Spacer(1, 4),
        p("Synopsis On", st["HeaderAITR"]),
        p("TECHPREP AI: INTELLIGENT AI INTERVIEW PRACTICE PLATFORM", st["TitleAITR"]),
        Spacer(1, 10),
    ]

    # Section 1
    story += [
        p("1. Introduction", st["H1AITR"]),
        p("1.1 Overview", st["H2AITR"]),
        p("In the contemporary technical recruitment landscape, candidates face high performance bars spanning technical execution, system design knowledge, and behavioral articulation. Traditional preparation platforms provide static practice sets (e.g., coding problems on LeetCode or static list questionnaires) but fail to replicate the dynamic, conversational, and multi-disciplinary experience of a live human interview.", st["BodyAITR"]),
        p("TechPrep AI is an intelligent, low-latency, full-stack mock interview platform designed to address these gaps. The system integrates real-time browser-based voice interaction, automated proctoring assessments, and domain-locked adaptive question sequencing. Utilizing a decoupled three-tier architecture, the platform comprises a responsive React client, a high-throughput Fastify API gateway, and a cognitive FastAPI service powered by state-of-the-art Large Language Models (Gemini 2.0 Flash and Llama 3.1 via Groq). During an active session, the candidate is prompted verbally via Text-to-Speech (TTS), responds verbally through automated Speech-to-Text (STT) transcription, and is monitored for behavioral integrity using a client-side computer vision model (TensorFlow.js BlazeFace) that flags look-away, multiple faces, and motion violations.", st["BodyAITR"]),
        
        p("1.2 Purpose", st["H2AITR"]),
        p("The purpose of TechPrep AI is to democratize high-fidelity placement preparation and interview coaching. The key goals achieved by the platform include:", st["BodyAITR"]),
        bullet_items([
            "Dynamic Conversational Practice: Bridges the gap between static text inputs and verbal articulation by forcing candidates to formulate answers aloud within structured timing windows.",
            "Objective, Metric-Based Feedback: Evaluates student responses across a comprehensive, industrial grading rubric (STAR structure, technical depth, communication, relevance, confidence, and conciseness) to produce quantitative scores out of 100.",
            "Low-Cost Integrity Verification: Provides lightweight, client-side, browser-native proctoring that detects visual cheating anomalies without requiring intrusive kernel-level desktop installations.",
            "Institutional Placement Analytics: Empowers university placement coordinators and recruiters to track cohort performance, identify skill gaps, and review automated PDF candidate reports stored in AWS S3 buckets."
        ], st["BodyAITR"]),
        Spacer(1, 4),
    ]

    # Section 2
    story += [
        p("2. Literature Survey", st["H1AITR"]),
        p("2.1 Existing Problem", st["H2AITR"]),
        p("Current placement preparation paradigms suffer from three primary limitations. Traditional coding sites evaluate syntax and test cases but ignore verbal structure, communication quality, and behavioral articulation (e.g., the STAR method). In addition, conversational tools (such as ChatGPT) provide generic, overly positive feedback, fail to enforce domain-locked curricula (often drifting off-topic), and lack chronological session memory constraints. Finally, remote assessments are highly vulnerable to proxy candidates and split-screen note referencing, while existing proctoring software requires heavy downloads that degrade performance on standard student hardware.", st["BodyAITR"]),
        
        p("2.2 Proposed Solution", st["H2AITR"]),
        p("TechPrep AI addresses these issues through a specialized orchestration layer and client-side computer vision:", st["BodyAITR"]),
        bullet_items([
            "Contextual Domain Cycling: A state-machine tracks historical questions, resume keywords, and domain competencies to generate logical, adaptive follow-up questions that push candidates to their technical limits.",
            "Hybrid Model Execution: Employs low-latency models (gemini-2.0-flash) for responsive, sub-second question generation and high-fidelity models (gemini-1.5-flash or llama-3.1-70b) asynchronously for deeper rubric grading.",
            "Client-Side Face Tracking: Uses TensorFlow.js BlazeFace locally in the browser. Landmark estimations compute eye-nose coordinates to determine attention vectors, executing proctoring loops at 30 FPS without server overhead."
        ], st["BodyAITR"]),
        Spacer(1, 4),
    ]

    # Section 3
    story += [
        p("3. Theoretical Analysis", st["H1AITR"]),
        p("3.1 Block Diagram", st["H2AITR"]),
        p("The block diagram below illustrates the structural dependencies, protocol interfaces, and data flow of the TechPrep AI platform:", st["BodyAITR"]),
        Spacer(1, 2),
        block_diagram(),
        Spacer(1, 8),
        
        p("3.2 Hardware/Software Designing", st["H2AITR"]),
        p("The requirements needed to develop, run, and host the platform are partitioned below:", st["BodyAITR"]),
        p("Hardware Requirements", st["H2AITR"]),
        bullet_items([
            "Hosting Server: 1 vCPU, 512 MB RAM, and 10 GB SSD (Render/Vercel virtual environment).",
            "User Client Device: Dual-Core CPU (Intel i3 / Ryzen 3 or higher), 4 GB RAM, 720p Webcam, and a functional microphone.",
            "Network Connection: Broadband internet connectivity with a minimum speed of 5 Mbps."
        ], st["BodyAITR"]),
        Spacer(1, 4),
        p("Software Requirements", st["H2AITR"]),
        bullet_items([
            "Operating Systems: Compatible with Windows 10/11, macOS, and standard Linux distributions.",
            "Development Runtimes: Node.js (v18.x+) and Python (v3.10.x+).",
            "Database & Storage: Supabase PostgreSQL relational database and AWS S3 storage buckets.",
            "Libraries & Frameworks: React.js (v18), Vite, TensorFlow.js (BlazeFace), Prisma ORM, Fastify API Gateway, FastAPI Python Microservice, and ReportLab PDF Compiler."
        ], st["BodyAITR"]),
        Spacer(1, 4),
    ]

    # Section 4
    story += [
        p("4. Applications", st["H1AITR"]),
        p("TechPrep AI provides a versatile utility layer that can be applied across several sectors:", st["BodyAITR"]),
        bullet_items([
            "Academic Placement Cells: Colleges can integrate the platform into placement cells to host mock practice camps, compiling cohort analytics to target critical soft and hard skill deficiencies.",
            "Corporate Pre-Screening: Human resource departments can deploy the platform to screen candidates' speaking structure and technical accuracy before scheduling synchronous interviews.",
            "Bootcamps and Ed-Tech: Online training programs can embed this software to prepare students for career transitions by aligning questions directly with custom syllabus modules.",
            "Self-Paced Practice: Individual job seekers can run mock sessions configured for specific companies, utilizing the resume parser to test their experience against specific job requirements."
        ], st["BodyAITR"]),
        Spacer(1, 4),
    ]

    # References
    story += [
        p("REFERENCES", st["H1AITR"]),
        numbered_items([
            "Google Generative AI Developer Guides: API references and schema enforcement details for Gemini 2.0 Flash (2025).",
            "Groq Llama 3.1 Inference Guidelines: Low-latency execution, token budgeting, and system instructions optimization (2025).",
            "TensorFlow.js BlazeFace Model: Bazrev, V. et al. 'BlazeFace: Sub-millisecond Face Detector on Mobile GPUs' (arXiv:1907.05047, 2019).",
            "ReportLab PDF User Guide: Dynamic document templates, Flowables layout specifications, and vector shapes drawing (2024).",
            "Fastify Framework Reference: Schema parsing, JSON validation hook sequences, and performance optimization (2024)."
        ], st["BodyAITR"]),
        Spacer(1, 10),
    ]

    # Administrative Footer block (signatures & group members side-by-side)
    admin_table_data = [
        [
            p("<b>Internal Guide:</b>", st["SignBold"]), 
            p("<b>Group Members:</b>", st["SignBold"])
        ],
        [
            p("Prof. Deepak Singh Chouhan", st["SignBody"]), 
            p("1. Swayam Garg (Enrollment No. 0111CS221193)", st["SignBody"])
        ],
        [
            p("Department of CSE(DS)", st["SignBody"]), 
            p("2. __________________________________", st["SignBody"])
        ],
        [
            p("<b>External Guide:</b>", st["SignBold"]), 
            p("3. __________________________________", st["SignBody"])
        ],
        [
            p("Mr./Ms. ____________________", st["SignBody"]), 
            p("4. __________________________________", st["SignBody"])
        ]
    ]
    
    admin_table = Table(admin_table_data, colWidths=[2.3*inch, 4.2*inch])
    admin_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    
    story.append(KeepTogether([admin_table]))

    doc = SimpleDocTemplate(str(OUT), pagesize=LETTER, leftMargin=inch, rightMargin=inch, topMargin=0.85*inch, bottomMargin=0.85*inch)
    doc.build(story)
    print(f"Created {OUT}")


if __name__ == "__main__":
    build()
