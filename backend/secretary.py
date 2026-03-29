from openai import OpenAI
from config import Config
# import os
# import json

client = OpenAI(
    api_key=Config.K2_API_KEY,
    base_url=Config.K2_BASE_URL
)

SYSTEM_PROMPTS = {
    "calendar_maker": (
        "You are a strict calendar assistant. You convert user input into a specific format. "
        "Format: <task> <time ranges> <location>. "
        "If the user provides unstructured text, extract these three elements and return ONLY the formatted string."
        "Return the result in valid JSON format: {'task': '...', 'time': '...', 'location': '...'}"
    ),
    
    "email_parser": (
        "You are an expert email triage assistant. Categorize emails into 'Important' or 'Unimportant'. "
        "DO NOT show your thinking process. DO NOT include any introductory text or conversational filler. "
        "Provide ONLY the following structure: "
        "### Important Emails\n"
        "[Email ID]: [1-sentence summary]\n\n"
        "### Unimportant Emails\n"
        "You had [X] receipts/newsletters ([List categories])."
    ),
    
   "daily_carbon_calculator": (
        "You are a Carbon Calculator. Your job is to take a list of daily tasks (including a newly added one) "
        "and calculate the total CO2 emissions for that specific day in kg. "
        "Consider transport mode, distance, and high-impact activities (like beef consumption). "
        "Return ONLY a JSON object: {'day_total_kg': <float>, 'breakdown': {'transport': <float>, 'food': <float>, 'other': <float>}}."
    ),
    
    "weekly_insight_strategist": (
        "You are a Sustainability Coach. You will be given a user's carbon data for the current week. "
        "1. Compare today's emissions to the average of the previous days. "
        "2. Predict if the user will meet their weekly reduction goal (x%) based on current trends. "
        "3. Provide 2-3 specific, actionable solutions to lower their footprint for the remainder of the week. "
        "Tone: Analytical and motivating."
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

#Test

# # Usage
# def load_mock_emails():
#     # 1. Get the absolute path of the current file (add_task.py)
#     current_dir = os.path.dirname(os.path.abspath(__file__))
    
#     # 2. Go up to 'backend/' then into 'data/mock_emails.json'
#     # Path: backend/agent/ -> .. -> data/mock_emails.json
#     file_path = os.path.join(current_dir, '..', 'data', 'mock_emails.json')
    
#     # 3. Standardize the path for the OS (Windows vs Mac/Linux)
#     normalized_path = os.path.normpath(file_path)
    
#     with open(normalized_path, 'r') as f:
#         return json.load(f)

# emails = load_mock_emails()
# # Pass the email list to K2
# ai_analysis = get_k2_completion(json.dumps(emails), case_type="email_parser")
# print(ai_analysis)

