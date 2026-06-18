import os
import json
import time
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Configure LLM Client (Gemini or Groq)
gemini_key = os.environ.get("GEMINI_API_KEY", "")
groq_key = os.environ.get("GROQ_API_KEY", "")

# Prioritize Groq as the main API client if the key is provided, otherwise fall back to Gemini
use_groq = bool(groq_key and groq_key != "mock" and groq_key != "mock-or-insert-key-here")
use_gemini = bool(gemini_key and gemini_key != "mock" and gemini_key != "mock-or-insert-key-here") if not use_groq else False

is_mock = not use_groq and not use_gemini

# Models
FAST_MODEL_NAME = "gemini-2.0-flash"
QUALITY_MODEL_NAME = "gemini-2.5-flash"

model = None
fast_model = None
groq_client = None

if use_groq:
    try:
        from groq import Groq
        groq_client = Groq(api_key=groq_key)
        logger.info("Groq AI configured successfully.")
    except Exception as e:
        logger.error(f"Error configuring Groq: {e}. Falling back to Gemini or Mock.")
        use_groq = False
        if gemini_key and gemini_key != "mock":
            use_gemini = True
        else:
            is_mock = True

if use_gemini:
    try:
        genai.configure(api_key=gemini_key)
        fast_model = genai.GenerativeModel(FAST_MODEL_NAME)
        model = genai.GenerativeModel(QUALITY_MODEL_NAME)
        logger.info(f"Gemini AI configured: fast={FAST_MODEL_NAME}, quality={QUALITY_MODEL_NAME}")
    except Exception as e:
        logger.error(f"Error configuring Gemini: {e}. Falling back to Mock mode.")
        is_mock = True
        model = None
        fast_model = None

if is_mock:
    logger.warning("No valid LLM API Key set. Running in MOCK Mode.")


def _is_rate_limit_error(e: Exception) -> bool:
    """Check if the exception is a rate limit (429) error."""
    err_str = str(e).lower()
    return "429" in err_str or "rate limit" in err_str or "rate_limit" in err_str or "ratelimit" in err_str


def _groq_call_with_retry(call_fn, max_retries: int = 3, base_delay: float = 1.5):
    """
    Execute a Groq API call with exponential backoff retry on rate limit errors.
    call_fn: a zero-argument callable that makes the Groq API call.
    Returns the result of call_fn().
    Raises the last exception if all retries fail.
    """
    last_exc = None
    for attempt in range(max_retries):
        try:
            return call_fn()
        except Exception as e:
            last_exc = e
            if _is_rate_limit_error(e):
                wait_time = base_delay * (2 ** attempt)  # 1.5s, 3s, 6s
                logger.warning(f"Groq rate limit hit (attempt {attempt + 1}/{max_retries}). Retrying in {wait_time:.1f}s...")
                time.sleep(wait_time)
            else:
                # Non-rate-limit errors: raise immediately
                raise
    logger.error(f"All {max_retries} Groq retry attempts exhausted.")
    raise last_exc


def get_model():
    return fast_model or model

def run_llm_stream(prompt: str, use_fast: bool = True):
    """
    Generator yielding text chunks from Gemini or Groq streaming API.
    Includes retry logic for rate limit errors on non-streaming calls.
    """
    if is_mock or not (use_groq or use_gemini):
        mock_text = "STRENGTH:\nDemonstrated strong domain logic and structured reasoning.\n\nWEAKNESS:\nLacked specific metrics to quantify system improvement outcomes.\n\nIMPROVEMENT:\nInclude explicit performance statistics like CPU or latency overhead."
        for char in mock_text:
            yield char
        return

    # --- GROQ STREAMING ---
    if use_groq and groq_client:
        active_model = "llama-3.1-8b-instant" if use_fast else "llama-3.3-70b-versatile"
        last_exc = None
        for attempt in range(3):
            try:
                completion = groq_client.chat.completions.create(
                    model=active_model,
                    messages=[{"role": "user", "content": prompt}],
                    stream=True,
                    temperature=0.3,
                )
                for chunk in completion:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        yield delta
                return  # Success
            except Exception as e:
                last_exc = e
                if _is_rate_limit_error(e):
                    wait_time = 1.5 * (2 ** attempt)
                    logger.warning(f"Groq stream rate limit (attempt {attempt + 1}/3). Retrying in {wait_time:.1f}s...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Groq stream error: {e}")
                    yield f"Error generating feedback: {str(e)}"
                    return
        logger.error(f"Groq stream failed after all retries: {last_exc}")
        yield f"Error generating feedback: {str(last_exc)}"
        return

    # --- GEMINI STREAMING ---
    active_model = fast_model if use_fast else model
    if active_model:
        try:
            response = active_model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini stream error: {e}")
            yield f"Error generating feedback: {str(e)}"

def run_gemini_json(prompt: str, generation_config: dict = None, use_fast: bool = False) -> dict:
    """
    Runs an LLM request (Gemini or Groq) and returns parsed JSON.
    Includes exponential backoff retries for Groq rate limit errors.
    use_fast=True uses gemini-2.0-flash or llama-3.1-8b-instant
    use_fast=False uses gemini-1.5-flash or llama-3.3-70b-specdec
    """
    if is_mock or not (use_groq or use_gemini):
        # --- MOCK FALLBACK DATA ---
        if "resume" in prompt.lower():
            return {
                "projects": [
                    {"name": "E-Commerce Microservices", "tech_stack": ["Node.js", "Docker", "RabbitMQ"], "description": "Event-driven order processing service cutting latency by 35%."},
                    {"name": "AI Search Engine", "tech_stack": ["Python", "FastAPI", "Elasticsearch"], "description": "Semantic QA system with Vector database indexing."}
                ],
                "skills": ["JavaScript", "TypeScript", "Python", "React", "Node.js", "Docker", "PostgreSQL", "Redis"],
                "experiences": [{"company": "Stripe", "role": "Software Engineering Intern", "duration": "May 2025 - Aug 2025", "tech": ["Ruby", "Go", "React"]}],
                "education": [{"degree": "B.S. Computer Science", "institution": "Stanford University", "year": "2026"}]
            }
        elif "interview question" in prompt.lower() or "generate" in prompt.lower():
            return {
                "brief_acknowledgment": "Good answer! I appreciate you walking me through that.",
                "question_text": "Tell me about a challenging technical problem you've solved. Walk me through your approach.",
                "question_type": "technical",
                "difficulty": "medium",
                "follow_up_hint": "Ask about specific tools used and quantified outcomes."
            }
        elif "post-interview" in prompt.lower() or "report" in prompt.lower():
            return {
                "executive_summary": "Strong technical foundations. Communication can be tightened.",
                "action_plan": [
                    "Practice STAR structures with data-layer optimizations.",
                    "Map event-driven microservice diagrams clearly.",
                    "Eliminate filler words — target 0 per 3-minute answer.",
                    "Lead with a 10-second summary before deep-diving.",
                    "Detail database schema design decisions explicitly."
                ]
            }
        else:
            return {
                "star_score": 20.0, "tech_depth_score": 19.5, "comm_score": 16.0,
                "relevance_score": 13.0, "confidence_score": 8.0, "conciseness_score": 4.0,
                "overall_score": 80.5,
                "star_feedback": {
                    "situation": "Clear outline of the performance bottleneck.",
                    "task": "Identified need to introduce Redis caching.",
                    "action": "Set up Redis cluster and optimized SQL queries.",
                    "result": "Reduced API latency from 600ms to 45ms."
                },
                "top_strength": "Excellent technical depth and quantitative delivery.",
                "top_weakness": "Occasional filler phrases reduced delivery impact.",
                "filler_words": ["basically", "actually"],
                "ideal_answer_skeleton": "State the metric regression → profiling tool → individual changes → final latency stats."
            }

    config = generation_config or {"temperature": 0.3}

    # --- GROQ ENGINE with retry ---
    if use_groq and groq_client:
        active_model = "llama-3.1-8b-instant" if use_fast else "llama-3.3-70b-versatile"

        def groq_call():
            completion = groq_client.chat.completions.create(
                model=active_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise JSON generator. Always respond with valid JSON only. No markdown, no extra text."
                    },
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=config.get("temperature", 0.3),
                max_tokens=2048,
            )
            text = completion.choices[0].message.content.strip()
            # Strip any accidental markdown wrapping
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())

        try:
            return _groq_call_with_retry(groq_call, max_retries=3, base_delay=1.5)
        except Exception as e:
            logger.error(f"Groq JSON call failed after retries: {e}")
            return {"error": "LLM API call failed", "message": str(e)}

    # --- GEMINI ENGINE ---
    try:
        active_model = fast_model if use_fast else model
        if "response_mime_type" in config and config["response_mime_type"] == "application/json":
            response = active_model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=config.get("temperature", 0.0),
                    response_mime_type="application/json"
                )
            )
        else:
            response = active_model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(**config)
            )

        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        logger.error(f"LLM API error: {e}")
        return {"error": "LLM API call failed", "message": str(e)}
