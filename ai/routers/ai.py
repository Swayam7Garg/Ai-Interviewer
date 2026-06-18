import asyncio
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import (
    ParseResumeRequest, ParseResumeResponse,
    GenerateQuestionRequest, GenerateQuestionResponse,
    ScoreAnswerRequest, ScoreAnswerResponse,
    GenerateFeedbackRequest, ReportSummaryRequest, ReportSummaryResponse
)
from services.gemini_client import run_gemini_json, get_model, is_mock, run_llm_stream
from services.parser import get_file_text
from services.role_prompts import get_role_config, get_question_generation_prompt, get_scoring_prompt, get_local_fallback_question, get_local_fallback_score

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai")


@router.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume(request: ParseResumeRequest):
    resume_text = request.resume_text

    if request.s3_key:
        try:
            resume_text = get_file_text(request.s3_key)
        except Exception as e:
            logger.error(f"Error reading file from storage: {e}")

    if not resume_text:
        raise HTTPException(status_code=400, detail="Either resume_text or s3_key must be provided")

    prompt = f"""You are a resume parser. Extract structured data from the resume below.
Return ONLY valid JSON, no markdown, no explanation.

Schema:
{{
  "projects": [{{ "name": str, "tech_stack": [str], "description": str }}],
  "skills": [str],
  "experiences": [{{ "company": str, "role": str, "duration": str, "tech": [str] }}],
  "education": [{{ "degree": str, "institution": str, "year": str }}]
}}

Resume:
{resume_text}
"""
    try:
        parsed_data = run_gemini_json(
            prompt,
            generation_config={"temperature": 0.0, "response_mime_type": "application/json"},
            use_fast=False  # Quality model for resume parsing
        )
        return parsed_data
    except Exception as e:
        logger.error(f"Error parsing resume: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")


@router.post("/generate-question", response_model=GenerateQuestionResponse)
async def generate_question(request: GenerateQuestionRequest):
    """
    Generate a contextually-aware interview question with a brief acknowledgment
    of the candidate's previous answer. Uses gemini-2.0-flash for low latency.
    """
    resume_ctx = (
        f"Candidate's resume summary:\n{request.resume_summary}"
        if request.resume_summary
        else "No resume provided."
    )

    # Build the role-specific, context-aware prompt
    prompt = get_question_generation_prompt(
        role=request.role,
        interview_type=request.interview_type,
        experience_level=request.experience_level,
        chat_history=request.chat_history or [],
        previous_questions=request.previous_questions,
        resume_ctx=resume_ctx,
        selected_domain=request.selected_domain,
        adaptive_mode=request.adaptive_mode or False,
        last_score=request.last_score,
        force_difficulty=request.force_difficulty,
    )

    try:
        question_data = run_gemini_json(
            prompt,
            generation_config={
                "temperature": 0.7,       # Some creativity for varied questions
                "response_mime_type": "application/json"
            },
            use_fast=True  # gemini-2.0-flash for real-time low latency
        )

        # Handle rate limits or other API errors returned by run_gemini_json
        if not question_data or "error" in question_data:
            err_msg = question_data.get("error", "Unknown LLM error") if question_data else "Empty response"
            logger.warning(f"Question generation LLM call failed: {err_msg}. Falling back to local domain-specific question generator.")
            return get_local_fallback_question(
                role=request.role,
                chat_history=request.chat_history or [],
                previous_questions=request.previous_questions,
                selected_domain=request.selected_domain
            )

        # Ensure brief_acknowledgment always exists
        if "brief_acknowledgment" not in question_data:
            question_data["brief_acknowledgment"] = ""

        return question_data
    except Exception as e:
        logger.error(f"Error generating question: {e}. Falling back to local domain-specific question generator.")
        return get_local_fallback_question(
            role=request.role,
            chat_history=request.chat_history or [],
            previous_questions=request.previous_questions,
            selected_domain=request.selected_domain
        )


@router.post("/score-answer", response_model=ScoreAnswerResponse)
async def score_answer(request: ScoreAnswerRequest):
    """
    Score a candidate's answer using role-specific evaluation criteria.
    Uses quality model (1.5-flash) since slight latency is acceptable for scoring.
    Includes a fast-fail check for empty or placeholder/short answers.
    """
    # Normalize answer for quick validation
    clean_ans = request.answer.strip().lower().replace(".", "").replace(",", "").replace("!", "").replace("?", "")
    words = clean_ans.split()
    
    placeholders = {
        "hi", "hello", "hey", "yes", "no", "ok", "okay", "nothing", "skip", 
        "i don't know", "i dont know", "dont know", "don't know", "i donnt know",
        "hello how are you", "hi how are you"
    }
    
    is_placeholder = clean_ans in placeholders
    is_short = len(words) < 3
    
    if is_short or is_placeholder:
        logger.info(f"Fast-failing scoring for short/placeholder answer: '{request.answer}'")
        return {
            "star_score": 0.0,
            "tech_depth_score": 0.0,
            "comm_score": 0.0,
            "relevance_score": 0.0,
            "confidence_score": 0.0,
            "conciseness_score": 0.0,
            "overall_score": 0.0,
            "star_feedback": {
                "situation": "No context or situation was provided.",
                "task": "No task or responsibility was described.",
                "action": "No action was taken.",
                "result": "No outcome or results were shared."
            },
            "top_strength": "None",
            "top_weakness": "The response was too short or did not address the question.",
            "filler_words": [],
            "ideal_answer_skeleton": "Provide a structured answer following the STAR methodology.",
            "ideal_answer_outline": "Please provide a complete answer with technical depth and clear structure.",
            "what_was_correct": [],
            "technical_errors": ["The answer was empty or too short to contain technical content."],
            "key_concepts_missed": ["All relevant concepts for this question were missed."],
            "interviewer_correction": "Please try to elaborate on your answer. Even if you're not fully sure, describe your initial thoughts, relevant technologies, or how you would approach solving the problem."
        }

    prompt = get_scoring_prompt(
        role=request.role,
        question=request.question,
        answer=request.answer,
        interview_type=request.interview_type,
    )
    try:
        score_data = run_gemini_json(
            prompt,
            generation_config={"temperature": 0.0, "response_mime_type": "application/json"},
            use_fast=True  # Fast model to avoid 70B rate limits and timeouts
        )
        
        # Handle rate limits or other API errors returned by run_gemini_json
        if not score_data or "error" in score_data:
            err_msg = score_data.get("error", "Unknown LLM error") if score_data else "Empty response"
            logger.warning(f"Scoring LLM call failed: {err_msg}. Falling back to local heuristic scoring.")
            return get_local_fallback_score(
                role=request.role,
                question=request.question,
                answer=request.answer,
                interview_type=request.interview_type
            )
            
        return score_data
    except Exception as e:
        logger.error(f"Error scoring answer: {e}. Falling back to local heuristic scoring.")
        return get_local_fallback_score(
            role=request.role,
            question=request.question,
            answer=request.answer,
            interview_type=request.interview_type
        )


@router.post("/generate-feedback")
async def generate_feedback(request: GenerateFeedbackRequest):
    """
    Stream coaching feedback after a question is scored.
    Uses fast model with streaming for real-time voice playback.
    """
    cfg = get_role_config(request.role)
    role_context = f"Key focus areas for {request.role}: {', '.join(cfg['domains'][:3])}"

    prompt = f"""You are a professional technical interview coach, direct but supportive, for: {request.role}
{role_context}

Question asked: {request.question}
Score summary: {request.score_json}

Write coaching feedback in this exact format (keep each section to 1-2 sentences, total under 120 words):

STRENGTH:
[What they did well — be specific to their actual answer, not generic]

WEAKNESS:
[The single most important thing missing — name exactly what was absent]

IMPROVEMENT:
[One concrete, role-specific action they can take to answer this better next time]

Keep tone: direct coach, not cheerleader. No filler phrases like "Great job!" or "That's interesting!".
"""

    async def event_generator():
        try:
            for chunk in run_llm_stream(prompt, use_fast=True):
                yield f"data: {chunk}\n\n"
                await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Error streaming LLM feedback: {e}")
            yield f"data: Error generating feedback: {str(e)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


def generate_heuristic_report(sd: dict) -> dict:
    role = sd.get("role", "Software Engineer")
    itype = sd.get("interview_type", "technical")
    score = sd.get("overall_score", 70.0)
    dim_avgs = sd.get("dimension_averages", {}) or {}
    
    # Calculate verdict
    if score >= 90:
        verdict = "Excellent"
    elif score >= 80:
        verdict = "Strong"
    elif score >= 70:
        verdict = "Moderate"
    elif score >= 50:
        verdict = "Developing"
    else:
        verdict = "Needs Focus"
        
    # Find strongest and weakest dimensions based on averages
    # max marks: star(25), techDepth(25), comm(20), relevance(15), confidence(10), conciseness(5)
    normalized_dims = {}
    max_scores = {"star": 25, "techDepth": 25, "comm": 20, "relevance": 15, "confidence": 10, "conciseness": 5}
    for k, max_val in max_scores.items():
        val = dim_avgs.get(k, 0)
        normalized_dims[k] = (val / max_val) * 100 if max_val > 0 else 0
        
    # Sort dimensions by performance
    sorted_dims = sorted(normalized_dims.items(), key=lambda x: x[1])
    
    weakest_dim = sorted_dims[0][0] if sorted_dims else "techDepth"
    strongest_dim = sorted_dims[-1][0] if sorted_dims else "comm"
    
    dim_display_names = {
        "star": "STAR Behavioral Structure",
        "techDepth": "Technical Depth & Algorithm Design",
        "comm": "Verbal Communication Clarity",
        "relevance": "Constraint Relevance & Focus",
        "confidence": "Assertiveness & Presence",
        "conciseness": "Conciseness & Precision"
    }
    
    strongest_name = dim_display_names.get(strongest_dim, "Technical reasoning")
    weakest_name = dim_display_names.get(weakest_dim, "Behavioral structure")
    
    # Build executive summary
    exec_summary = (
        f"The candidate demonstrated a {verdict.lower()} performance with an overall evaluated score of {round(score, 1)}/100 "
        f"for the {role} role in a {itype} interview. "
        f"Their primary strength was in {strongest_name}, showcasing structured logic and domain relevance. "
        f"However, key areas for growth were identified in {weakest_name}, where further practice will help align responses to industry benchmarks."
    )
    
    # Build 5 specific actions
    actions_pool = {
        "star": [
            "Structure answers strictly with the STAR framework, detailing the exact bottleneck in Situation.",
            "Formulate Action sections around individual contributions rather than team-level tasks.",
            "Quantify results by adding explicit percentages, latency drops, or dollar impacts.",
            "Practice the STAR Method Coach lessons on behavioral storytelling.",
            "Limit the initial background explanation to 45 seconds to leave room for the results."
        ],
        "techDepth": [
            "Explain algorithmic time and space complexities (Big O) explicitly during architecture design.",
            "Detail database schema designs, indexing strategies, and transaction isolation tradeoffs.",
            "Practice system design concepts including load balancers, rate limiting, and database sharding.",
            "Review core language fundamentals (e.g. JVM garbage collection or Java concurrency).",
            "Discuss caching configuration parameters (e.g. Redis eviction policies) explicitly."
        ],
        "comm": [
            "Pace your verbal delivery by eliminating filler words like 'basically', 'actually', or 'like'.",
            "Speak assertively with confident tone modulation to command technical authority.",
            "Organize responses into clear bullet points: 'First, I did X... Second, I did Y...'.",
            "Record audio of your practice answers to audit filler word counts.",
            "Avoid trailing off at the end of sentences; finish with a summary of the outcome."
        ],
        "relevance": [
            "Anchor answers directly to the constraints and parameters specified in the prompt.",
            "Avoid introducing unrelated technologies; stick to solving the immediate problem.",
            "Restate the interviewer's question briefly at the start to ensure alignment.",
            "Highlight trade-offs specifically related to the given problem scale.",
            "Ask clarifying questions to narrow down the system requirements."
        ],
        "confidence": [
            "Maintain steady volume and pace to convey professional credibility.",
            "Answer questions directly before deep-diving into execution details.",
            "State your design decisions clearly without over-qualifying statements.",
            "Minimize hesitation pauses by outlining your answer structure in your head first.",
            "Acknowledge edge cases transparently and discuss how you would address them."
        ],
        "conciseness": [
            "Limit responses to under 200 words to maintain high engagement and density.",
            "Avoid repeating details that were already mentioned in the summary.",
            "State the final result first, then outline the timeline if asked.",
            "Practice summarization exercises to distill technical features into single sentences.",
            "Stop speaking once you have answered the prompt; avoid rambling."
        ]
    }
    
    # Select actions based on weakest dimensions
    action_plan = []
    
    # Add 2 from weakest, 2 from second weakest, and 1 from third weakest
    try:
        w1 = sorted_dims[0][0]
        action_plan.extend(actions_pool.get(w1, [])[:2])
    except:
        pass
        
    try:
        w2 = sorted_dims[1][0]
        action_plan.extend(actions_pool.get(w2, [])[:2])
    except:
        pass
        
    try:
        w3 = sorted_dims[2][0]
        action_plan.extend(actions_pool.get(w3, [])[:1])
    except:
        pass
        
    # Fallback to general actions if we don't have enough
    while len(action_plan) < 5:
        action_plan.append("Practice structural drills using the STAR framework to organize answers.")
        
    return {
        "executive_summary": exec_summary,
        "action_plan": action_plan[:5]
    }


@router.post("/report-summary", response_model=ReportSummaryResponse)
async def report_summary(request: ReportSummaryRequest):
    """
    Generate end-of-interview performance report.
    Uses quality model for thorough analysis.
    """
    sd = request.session_data
    cfg = get_role_config(sd.get("role", ""))
    role_domains = ", ".join(cfg["domains"][:4])

    prompt = f"""You are writing a post-interview performance report for a candidate.

Role: {sd.get('role')}
Interview type: {sd.get('interview_type')}
Overall score: {sd.get('overall_score')}/100
Dimension averages: {sd.get('dimension_averages')}
Number of questions answered: {len(sd.get('questions_and_scores', []))}
Key competency areas for this role: {role_domains}

Write a professional performance report:

1. executive_summary: 3 sentences.
   - Sentence 1: Overall performance verdict with score context (e.g. 'Strong/Moderate/Weak performance at X/100').
   - Sentence 2: Biggest strength with specific evidence from the session.
   - Sentence 3: Most critical improvement area with a specific next step.

2. action_plan: exactly 5 specific, role-relevant action items.
   Format each as: "Practice [X] by doing [Y] — target [Z measurable outcome]"
   Make each item specific to {sd.get('role')} competencies.

Return ONLY valid JSON:
{{
  "executive_summary": "string",
  "action_plan": ["string", "string", "string", "string", "string"]
}}
"""
    try:
        report_data = run_gemini_json(
            prompt,
            generation_config={"temperature": 0.3, "response_mime_type": "application/json"},
            use_fast=True  # Fast model to avoid 70B rate limits and timeouts
        )
        if not report_data or "executive_summary" not in report_data or "action_plan" not in report_data or "error" in report_data:
            raise ValueError("Invalid report summary format or LLM client error")
        return report_data
    except Exception as e:
        logger.error(f"Error generating report summary or fallback triggered: {e}. Generating dynamic local heuristic summary.")
        heuristic_data = generate_heuristic_report(sd)
        return heuristic_data


from pydantic import BaseModel
from fastapi import BackgroundTasks

class GenerateReportEndpointRequest(BaseModel):
    session_id: str
    user_id: str

@router.post("/generate-report")
async def generate_report_endpoint(request: GenerateReportEndpointRequest, background_tasks: BackgroundTasks):
    from workers.pdf_worker import generate_pdf_report
    background_tasks.add_task(generate_pdf_report, request.session_id, request.user_id)
    return {"status": "triggered", "message": "PDF report generation started in background."}
