from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# --- ১. ফোল্ডারের লোকেশন ফিক্স (Vercel Fix) ---
# আমরা এখন বলে দিচ্ছি ফাইলটা ঠিক কোথায় আছে
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
ASSETS_DIR = os.path.join(PUBLIC_DIR, "assets")

# --- ২. ডাটাবেস কানেকশন ---
MONGO_URI = os.getenv("MONGO_URI")

try:
    # কানেকশন এরর হলেও অ্যাপ ক্র্যাশ করবে না, শুধু প্রিন্ট করবে
    client = MongoClient(MONGO_URI)
    db = client["english_janala_db"]
    users_collection = db["users"]
    print("✅ MongoDB Connected Successfully!")
except Exception as e:
    print(f"❌ Database Connection Failed: {e}")
    users_collection = None

# --- ৩. ডাটা মডেল ---
class User(BaseModel):
    name: str
    password: str

# --- ৪. API রাউটস ---
@app.post("/api/register")
def register_user(user: User):
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    existing_user = users_collection.find_one({"name": user.name})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    users_collection.insert_one({"name": user.name, "password": user.password})
    return {"message": "User registered successfully"}

@app.post("/api/login")
def login_user(user: User):
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    found_user = users_collection.find_one({"name": user.name, "password": user.password})
    
    if found_user:
        return {"message": "Login Successful", "username": found_user["name"]}
    else:
        raise HTTPException(status_code=400, detail="Invalid Credentials")

# --- ৫. ফ্রন্টেন্ড মাউন্ট (Updated Path) ---
# এখন আর ক্র্যাশ করবে না কারণ আমরা os.path ব্যবহার করেছি
if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

if os.path.exists(PUBLIC_DIR):
    app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=True), name="public")

# রুট ইউআরএল হ্যান্ডলার
@app.get("/")
async def read_index():
    return FileResponse(os.path.join(PUBLIC_DIR, 'index.html'))