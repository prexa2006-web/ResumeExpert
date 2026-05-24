from utils import llm
import json

def optimize_text(resume_text, mode, target_role):
    prompt = f"""You are an expert ATS Resume Writer. Analyze the provided resume text and rewrite it into a highly professional format.
    
    CRITICAL INSTRUCTIONS FOR LINKS:
    If you find a GitHub, LinkedIn, or Portfolio username/link, you MUST convert it into a FULL valid URL starting with 'https://'. 
    Example: 'omsolanki1311' should become 'https://github.com/omsolanki1311'. Do NOT just return text.
    
    EXPECTED JSON STRUCTURE:
    {{
        "personal_info": {{
            "name": "Full Name",
            "email": "Email Address",
            "phone": "Phone Number",
            "location": "City, Country",
            "linkedin": "FULL HTTPS URL (if any)",
            "github": "FULL HTTPS URL (if any)",
            "portfolio": "FULL HTTPS URL (if any, separate from Github)"
        }},
        "summary": "A strong professional summary...",
        "education": [
            {{"degree": "Degree Name", "institution": "College Name", "year": "Year", "score": "Grade/Percentage"}}
        ],
        "skills": [
            {{"category": "Languages", "items": "Python, Java, etc."}}
        ],
        "projects": [
            {{"name": "Project Name", "tech_stack": "React, Node, etc.", "description": "1-2 lines explaining what it does and impact", "link": "FULL HTTPS URL for project (if any)"}}
        ],
        "experience": [
            {{"role": "Job Title", "company": "Company Name", "duration": "Dates", "description": "Bullet points..."}}
        ],
        "certifications": ["Cert 1", "Cert 2"]
    }}
    """
    
    if mode == "keep_format":
        prompt += f"\n\nRULE: Polish the grammar and vocabulary, but DO NOT add any new skills, projects, or experiences that are not in the original text.\n\nOriginal Resume:\n{resume_text}"
    else:
        prompt += f"\n\nRULE: Enhance the content and ADD highly relevant industry keywords for a '{target_role}' role to boost the ATS score.\n\nOriginal Resume:\n{resume_text}"
    
    response = llm.ask(prompt)
    
    try:
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            response = response.split("```")[1].split("```")[0].strip()
        return response
    except Exception as e:
        return response