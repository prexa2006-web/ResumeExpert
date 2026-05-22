from utils import llm

def optimize_text(resume_text, mode, target_role):
    if mode == "keep_format":
        # Option 1: Sirf words change honge, naya kuch add nahi hoga
        prompt = f"""You are an expert resume editor. Rewrite the following resume text to improve grammar, clarity, and professional impact. 
        CRITICAL RULE: DO NOT add any new skills, new job experiences, or new sections. Keep the exact original meaning, just use better professional vocabulary.
        Resume Text: {resume_text}"""
    else:
        # Option 2: Naye keywords aur text add kar sakte hain
        prompt = f"""You are an expert resume writer. Rewrite and optimize this resume for a {target_role} role. 
        You ARE ALLOWED to add relevant industry keywords, professional phrases, and standard skills that match the target role to make it more ATS friendly.
        Resume Text: {resume_text}"""
    
    return llm.ask(prompt)