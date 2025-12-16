from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# ১. এনভায়রনমেন্ট ভেরিয়েবল লোড করা (পাসওয়ার্ড লুকানোর জন্য)
load_dotenv()

app = FastAPI()

# ২. ডাটাবেস কানেকশন (MongoDB)
# .env ফাইল থেকে লিঙ্কটা নিয়ে আসবে
MONGO_URI = os.getenv("MONGO_URI")

try:
    client = MongoClient(MONGO_URI)
    db = client["english_janala_db"]  # ডাটাবেসের নাম
    users_collection = db["users"]    # টেবিলের নাম (User দের রাখার জন্য)
    print("✅ MongoDB Connected Successfully!")
except Exception as e:
    print(f"❌ Database Connection Failed: {e}")

# ৩. ডাটা মডেল (ইউজারের কি কি তথ্য আমরা নেব)
class User(BaseModel):
    name: str
    password: str

# ৪. রেজিস্ট্রেশন API (নতুন ইউজার জমানোর জন্য)
@app.post("/api/register")
def register_user(user: User):
    # আগে চেক করি এই নামে কেউ আছে কি না
    existing_user = users_collection.find_one({"name": user.name})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # না থাকলে সেভ করি
    users_collection.insert_one({"name": user.name, "password": user.password})
    return {"message": "User registered successfully"}

# ৫. লগইন API (ইউজার চেক করার জন্য)
@app.post("/api/login")
def login_user(user: User):
    # নাম আর পাসওয়ার্ড মিলিয়ে দেখা
    found_user = users_collection.find_one({"name": user.name, "password": user.password})
    
    if found_user:
        return {"message": "Login Successful", "username": found_user["name"]}
    else:
        raise HTTPException(status_code=400, detail="Bhul password ba username")

# ৬. ফ্রন্টেন্ড কানেক্ট করা (Static Files)
# তোমার public ফোল্ডারটা আমরা মাউন্ট করছি
app.mount("/assets", StaticFiles(directory="public/assets"), name="assets")
app.mount("/", StaticFiles(directory="public", html=True), name="public")

# ৭. হোম পেজ রুট (সরাসরি index.html দেখাবে)
@app.get("/")
async def read_index():
    return FileResponse('public/index.html')