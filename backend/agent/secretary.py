from openai import OpenAI
from config import config


client = OpenAI(
    api_key=config.K2_API_KEY,
    base_url=config.K2_BASE_URL
)

SYSTEM_PROMPTS = {
    "calendar_maker": (
        "You are a strict calendar assistant. You convert user input into a specific format. "
        "Format: <task> <time ranges> <location>. "
        "If the user provides unstructured text, extract these three elements and return ONLY the formatted string."
    ),
    
    "email_parser": (
        "You are an expert email triage assistant. Categorize emails into 'Important' or 'Unimportant'. "
        "1. List all Important emails with a 1-sentence summary for each. "
        "2. Provide a single, extremely brief summary for all Unimportant emails (e.g., 'You had 5 newsletters and 10 spam alerts')."
    ),
    
    "summarizer": (
        "You are a Carbon Footprint Analyst. Calculate the user's weekly average carbon emissions based on task locations/distances. "
        "Compare this to last week's data. If emissions have increased or failed to drop by the user's goal (x%), "
        "provide 3 actionable tips to decrease it. Keep your tone data-driven and encouraging."
    ),
    
    "default": "You are a helpful assistant powered by K2 Think V2 from MBZUAI."
}

def get_k2_completion(user_input, case_type="default"):
    # Select the instruction based on the case
    system_instruction = SYSTEM_PROMPTS.get(case_type, SYSTEM_PROMPTS["default"])
    
    response = client.chat.completions.create(
        model="MBZUAI-IFM/K2-Think-v2",
        messages=[
            {"role": "system", "content": system_instruction}, # Dynamic part
            {"role": "user", "content": user_input}
        ]
    )
    return response.choices[0].message.content

# Usage
# print(get_k2_completion("Fix this Python bug.", case_type="coder"))