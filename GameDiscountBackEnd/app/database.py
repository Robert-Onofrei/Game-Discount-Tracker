import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

#Used MongoDb for database

MONGO_URI = os.getenv("MONGO_URI")
print("MONGO_URI loaded:", MONGO_URI)

client = AsyncIOMotorClient(MONGO_URI)
db = client["game_tracker"]