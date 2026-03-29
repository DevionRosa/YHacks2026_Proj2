import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    K2_API_KEY = os.getenv("K2_API_KEY")
    K2_BASE_URL = os.getenv("K2_BASE_URL")