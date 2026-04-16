from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import random
import string
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DEFAULT_DB_NAME = "nexorium"


def get_mongo_url() -> str:
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        raise RuntimeError("MONGO_URL environment variable is required")
    return mongo_url


def get_database_name() -> str:
    return os.environ.get("MONGO_DB_NAME", DEFAULT_DB_NAME)


client = AsyncIOMotorClient(get_mongo_url())
db = client[get_database_name()]


app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- JWT & Auth ---
JWT_ALGORITHM = "HS256"
DEFAULT_JWT_SECRET = "nexorium-demo-secret"

def get_jwt_secret():
    return os.environ.get("JWT_SECRET", DEFAULT_JWT_SECRET)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Models ---
class AssetResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    fileName: str
    fileSize: int = 0
    fileType: str = ""
    fileHash: str
    nftId: str
    owner: str
    ownerEmail: str = ""
    originalCreatorEmail: str = ""
    walletAddress: str = ""
    ipfsHash: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)
    royaltyPercentage: float = 10.0
    royaltyEarnings: float = 0.0
    royaltyCurrency: str = "USD"
    activeLicenses: List[Dict[str, Any]] = Field(default_factory=list)
    transactionHistory: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = "processing"
    createdAt: str
    mintedAt: Optional[str] = None

class VerifyRequest(BaseModel):
    query: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = "User"

class LoginRequest(BaseModel):
    email: str
    password: str

class ConnectWalletRequest(BaseModel):
    walletAddress: str

class TransferAssetRequest(BaseModel):
    assetId: str
    newOwner: str
    newOwnerWalletAddress: str = ""
    saleAmount: float = 100.0

class LicenseAssetRequest(BaseModel):
    assetId: str
    licenseeEmail: str
    licenseType: str = "Commercial"
    durationDays: int = 365
    feeAmount: float = 75.0

# --- Helpers ---
def generate_nft_id():
    digits = ''.join(random.choices(string.digits, k=5))
    return f"NFT-{digits}"

def generate_asset_id():
    chars = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
    return chars

def build_transaction(action_type: str, user: str, wallet_address: str = "", extra: Optional[Dict[str, Any]] = None):
    return {
        "actionType": action_type,
        "user": user,
        "walletAddress": wallet_address,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **(extra or {}),
    }

def build_license_record(asset: Dict[str, Any], creator_email: str, req: LicenseAssetRequest):
    now = datetime.now(timezone.utc)
    license_id = "LIC-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    issued_at = now.isoformat()
    expires_at = (now + timedelta(days=max(req.durationDays, 1))).isoformat()
    royalty_amount = round((req.feeAmount * float(asset.get("royaltyPercentage", 10.0))) / 100, 2)
    return {
        "licenseId": license_id,
        "licenseeEmail": req.licenseeEmail.strip().lower(),
        "licenseType": req.licenseType.strip() or "Commercial",
        "durationDays": max(req.durationDays, 1),
        "feeAmount": req.feeAmount,
        "royaltyAmount": royalty_amount,
        "status": "active",
        "issuedAt": issued_at,
        "expiresAt": expires_at,
        "creatorEmail": creator_email,
    }

def build_audit_report(asset: Dict[str, Any]):
    transactions = asset.get("transactionHistory", [])
    licenses = asset.get("activeLicenses", [])
    return {
        "assetId": asset.get("id"),
        "fileName": asset.get("fileName"),
        "nftId": asset.get("nftId"),
        "ownerEmail": asset.get("ownerEmail"),
        "originalCreatorEmail": asset.get("originalCreatorEmail"),
        "walletAddress": asset.get("walletAddress", ""),
        "fileHash": asset.get("fileHash"),
        "ipfsHash": asset.get("ipfsHash", ""),
        "royaltyPercentage": asset.get("royaltyPercentage", 0),
        "royaltyEarnings": asset.get("royaltyEarnings", 0),
        "royaltyCurrency": asset.get("royaltyCurrency", "USD"),
        "activeLicenseCount": len([license for license in licenses if license.get("status") == "active"]),
        "activeLicenses": licenses,
        "transactionCount": len(transactions),
        "timeline": transactions,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

def build_metadata(file_name: str, file_hash: str, owner_email: str, wallet_address: str, timestamp: str, nft_id: str):
    ipfs_hash = f"ipfs://fakeHash{file_hash[:12]}"
    return {
        "fileName": file_name,
        "fileHash": file_hash,
        "ownerEmail": owner_email,
        "walletAddress": wallet_address,
        "timestamp": timestamp,
        # Replace this placeholder with an IPFS upload service such as Pinata, NFT.Storage, or a self-hosted node.
        "ipfsHash": ipfs_hash,
        "nftId": nft_id,
    }

async def mintNFT(file_hash: str):
    # Replace with actual Solidity contract interaction:
    # contract.mintNFT(file_hash, metadata_uri) via ethers.py/web3.py or a backend signer.
    return {
        "simulated": True,
        "transactionHash": "0x" + hashlib.sha256(f"mint:{file_hash}".encode("utf-8")).hexdigest(),
    }

# --- Auth Routes ---
@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    email = req.email.strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(req.password)
    doc = {"email": email, "password_hash": hashed, "name": req.name, "walletAddress": "", "createdAt": datetime.now(timezone.utc).isoformat()}
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id, email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    return {"id": user_id, "email": email, "name": req.name, "token": token}

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    email = req.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    token = create_access_token(user_id, email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    return {"id": user_id, "email": email, "name": user.get("name", "User"), "token": token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {"id": user["_id"], "email": user["email"], "name": user.get("name", "User"), "walletAddress": user.get("walletAddress", "")}

@api_router.post("/connect-wallet")
async def connect_wallet(req: ConnectWalletRequest, request: Request):
    current_user = await get_current_user(request)
    wallet_address = req.walletAddress.strip()
    if not wallet_address.startswith("0x") or len(wallet_address) != 42:
        raise HTTPException(status_code=400, detail="Invalid wallet address")

    existing_wallet = current_user.get("walletAddress", "")
    if existing_wallet and existing_wallet.lower() != wallet_address.lower():
        return {
            "walletAddress": existing_wallet,
            "linked": False,
            "message": "A wallet is already linked to this account",
        }

    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"walletAddress": wallet_address}}
    )
    return {
        "walletAddress": wallet_address,
        "linked": True,
        "message": "Wallet connected",
    }

# --- Seed Demo Users ---
async def seed_demo_users():
    demo_users = [
        {"email": "user1@nexorium.com", "password": "123456", "name": "User One"},
        {"email": "user2@nexorium.com", "password": "123456", "name": "User Two"},
    ]
    for u in demo_users:
        password_hash = hash_password(u["password"])
        existing = await db.users.find_one({"email": u["email"]})
        if not existing:
            await db.users.insert_one({
                "email": u["email"],
                "password_hash": password_hash,
                "name": u["name"],
                "walletAddress": "",
                "createdAt": datetime.now(timezone.utc).isoformat(),
            })
        else:
            await db.users.update_one(
                {"email": u["email"]},
                {"$set": {"password_hash": password_hash, "name": u["name"]}}
            )
    await db.users.create_index("email", unique=True)

# --- Asset Routes ---
@api_router.post("/assets/upload", response_model=AssetResponse)
async def upload_asset(
    request: Request,
    file: UploadFile = File(...),
    walletAddress: str = Form(default="")
):
    current_user = await get_current_user(request)
    contents = await file.read()
    file_hash = hashlib.sha256(contents).hexdigest()
    nft_id = generate_nft_id()
    asset_id = generate_asset_id()
    now = datetime.now(timezone.utc).isoformat()
    linked_wallet = walletAddress or current_user.get("walletAddress", "")
    metadata = build_metadata(file.filename, file_hash, current_user["email"], linked_wallet, now, nft_id)
    mint_receipt = await mintNFT(file_hash)

    doc = {
        "id": asset_id,
        "fileName": file.filename,
        "fileSize": len(contents),
        "fileType": file.content_type or "",
        "fileHash": file_hash,
        "nftId": nft_id,
        "owner": current_user.get("name", current_user["email"]),
        "ownerEmail": current_user["email"],
        "originalCreatorEmail": current_user["email"],
        "userId": current_user["_id"],
        "walletAddress": linked_wallet,
        "ipfsHash": metadata["ipfsHash"],
        "metadata": metadata,
        "royaltyPercentage": 10.0,
        "royaltyEarnings": 0.0,
        "royaltyCurrency": "USD",
        "activeLicenses": [],
        "transactionHistory": [
            build_transaction("upload", current_user["email"], linked_wallet),
            build_transaction("metadata", current_user["email"], linked_wallet, {"ipfsHash": metadata["ipfsHash"]}),
            build_transaction("mint", current_user["email"], linked_wallet, {"transactionHash": mint_receipt["transactionHash"]}),
        ],
        "status": "processing",
        "createdAt": now,
        "mintedAt": None,
    }
    await db.assets.insert_one(doc)
    doc.pop("_id", None)
    return AssetResponse(**doc)

@api_router.get("/assets", response_model=List[AssetResponse])
async def get_assets(request: Request, search: Optional[str] = None):
    current_user = await get_current_user(request)
    query = {"userId": current_user["_id"]}
    if search:
        query = {"$and": [
            {"userId": current_user["_id"]},
            {"$or": [
                {"fileName": {"$regex": search, "$options": "i"}},
                {"nftId": {"$regex": search, "$options": "i"}},
                {"fileHash": {"$regex": search, "$options": "i"}},
            ]}
        ]}
    assets = await db.assets.find(query, {"_id": 0}).sort("createdAt", -1).to_list(500)
    return [AssetResponse(**a) for a in assets]

@api_router.get("/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, request: Request):
    current_user = await get_current_user(request)
    asset = await db.assets.find_one({"id": asset_id, "userId": current_user["_id"]}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse(**asset)

@api_router.patch("/assets/{asset_id}/mint", response_model=AssetResponse)
async def mint_asset(asset_id: str, request: Request):
    current_user = await get_current_user(request)
    now = datetime.now(timezone.utc).isoformat()
    transaction = build_transaction("mint", current_user["email"], current_user.get("walletAddress", ""))
    result = await db.assets.find_one_and_update(
        {"id": asset_id, "userId": current_user["_id"]},
        {
            "$set": {"status": "completed", "mintedAt": now},
            "$push": {"transactionHistory": transaction},
        },
        return_document=True,
        projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse(**result)

# --- Verify Route ---
@api_router.post("/verify")
async def verify_ownership(req: VerifyRequest):
    query_str = req.query.strip()
    asset = await db.assets.find_one(
        {"$or": [
            {"fileHash": query_str},
            {"nftId": query_str}
        ]},
        {"_id": 0}
    )
    if not asset:
        return {"verified": False, "message": "No asset found with this hash or NFT ID"}
    verify_transaction = build_transaction("verify", asset.get("ownerEmail", "public-verifier"), asset.get("walletAddress", ""))
    await db.assets.update_one({"id": asset["id"]}, {"$push": {"transactionHistory": verify_transaction}})
    asset.setdefault("transactionHistory", []).append(verify_transaction)
    verified_message = "Verified on-chain identity" if asset.get("walletAddress") else "Ownership Verified"
    return {
        "verified": True,
        "message": verified_message,
        "ownerEmail": asset.get("ownerEmail", ""),
        "walletAddress": asset.get("walletAddress", ""),
        "timestamp": asset.get("createdAt", ""),
        "verificationStatus": "verified",
        "asset": AssetResponse(**asset).model_dump()
    }

@api_router.post("/transfer-asset")
async def transfer_asset(req: TransferAssetRequest, request: Request):
    current_user = await get_current_user(request)
    asset = await db.assets.find_one({"id": req.assetId, "userId": current_user["_id"]}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found or transfer not allowed")

    new_owner_email = req.newOwner.strip().lower()
    if not new_owner_email:
        raise HTTPException(status_code=400, detail="New owner is required")

    new_owner = await db.users.find_one({"email": new_owner_email})
    royalty_percentage = float(asset.get("royaltyPercentage", 10.0))
    royalty_amount = round((req.saleAmount * royalty_percentage) / 100, 2)
    new_owner_wallet = req.newOwnerWalletAddress or (new_owner or {}).get("walletAddress", "")
    now = datetime.now(timezone.utc).isoformat()

    transaction = build_transaction(
        "transfer",
        current_user["email"],
        current_user.get("walletAddress", asset.get("walletAddress", "")),
        {
            "fromOwner": asset.get("ownerEmail", current_user["email"]),
            "toOwner": new_owner_email,
            "saleAmount": req.saleAmount,
            "royaltyPercentage": royalty_percentage,
            "royaltyAmount": royalty_amount,
            "message": f"{royalty_percentage}% royalty allocated to original creator",
        }
    )

    update_doc = {
        "owner": (new_owner or {}).get("name", new_owner_email),
        "ownerEmail": new_owner_email,
        "walletAddress": new_owner_wallet,
        "transferredAt": now,
        "royaltyEarnings": round(float(asset.get("royaltyEarnings", 0.0)) + royalty_amount, 2),
    }
    if new_owner:
        update_doc["userId"] = str(new_owner["_id"])

    result = await db.assets.find_one_and_update(
        {"id": req.assetId, "userId": current_user["_id"]},
        {"$set": update_doc, "$push": {"transactionHistory": transaction}},
        return_document=True,
        projection={"_id": 0}
    )
    return {
        "asset": AssetResponse(**result).model_dump(),
        "transaction": transaction,
        "royalty": {
            "percentage": royalty_percentage,
            "amount": royalty_amount,
            "message": f"{royalty_percentage}% royalty allocated to original creator",
        },
    }

@api_router.post("/license-asset")
async def license_asset(req: LicenseAssetRequest, request: Request):
    current_user = await get_current_user(request)
    asset = await db.assets.find_one(
        {
            "id": req.assetId,
            "$or": [
                {"userId": current_user["_id"]},
                {"ownerEmail": current_user["email"]},
                {"originalCreatorEmail": current_user["email"]},
            ],
        },
        {"_id": 0}
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    license_record = build_license_record(asset, current_user["email"], req)
    royalty_earnings = round(float(asset.get("royaltyEarnings", 0.0)) + float(license_record["royaltyAmount"]), 2)
    transaction = build_transaction(
        "license",
        current_user["email"],
        asset.get("walletAddress", ""),
        {
            "licenseId": license_record["licenseId"],
            "licenseeEmail": license_record["licenseeEmail"],
            "licenseType": license_record["licenseType"],
            "feeAmount": license_record["feeAmount"],
            "royaltyAmount": license_record["royaltyAmount"],
            "message": f"{license_record['licenseType']} license activated for {license_record['licenseeEmail']}",
        }
    )

    result = await db.assets.find_one_and_update(
        {"id": req.assetId},
        {
            "$set": {"royaltyEarnings": royalty_earnings},
            "$push": {
                "activeLicenses": license_record,
                "transactionHistory": transaction,
            },
        },
        return_document=True,
        projection={"_id": 0}
    )
    return {
        "asset": AssetResponse(**result).model_dump(),
        "license": license_record,
        "auditReport": build_audit_report(result),
    }

@api_router.get("/assets/{asset_id}/audit-report")
async def get_audit_report(asset_id: str, request: Request):
    current_user = await get_current_user(request)
    asset = await db.assets.find_one(
        {
            "id": asset_id,
            "$or": [
                {"userId": current_user["_id"]},
                {"ownerEmail": current_user["email"]},
                {"originalCreatorEmail": current_user["email"]},
            ],
        },
        {"_id": 0}
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return build_audit_report(asset)

@api_router.get("/transactions/{asset_id}")
async def get_transactions(asset_id: str, request: Request):
    current_user = await get_current_user(request)
    asset = await db.assets.find_one(
        {
            "id": asset_id,
            "$or": [
                {"userId": current_user["_id"]},
                {"ownerEmail": current_user["email"]},
                {"originalCreatorEmail": current_user["email"]},
            ],
        },
        {"_id": 0, "transactionHistory": 1}
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"assetId": asset_id, "transactions": asset.get("transactionHistory", [])}

# --- Profile Routes ---
@api_router.get("/profile")
async def get_profile(request: Request):
    user = await get_current_user(request)
    user_id = user["_id"]
    total_assets = await db.assets.count_documents({"userId": user_id})
    total_nfts = await db.assets.count_documents({"userId": user_id, "status": "completed"})
    return {
        "username": user.get("name", "User"),
        "email": user["email"],
        "walletAddress": user.get("walletAddress", ""),
        "totalAssets": total_assets,
        "totalNFTs": total_nfts,
    }

# --- Stats Route ---
@api_router.get("/stats")
async def get_stats(request: Request):
    user = await get_current_user(request)
    user_id = user["_id"]
    asset_query = {
        "$or": [
            {"userId": user_id},
            {"ownerEmail": user["email"]},
            {"originalCreatorEmail": user["email"]},
        ]
    }
    creator_query = {"originalCreatorEmail": user["email"]}
    total_assets = await db.assets.count_documents(asset_query)
    total_nfts = await db.assets.count_documents({"$and": [asset_query, {"status": "completed"}]})
    processing = await db.assets.count_documents({"$and": [asset_query, {"status": "processing"}]})
    creator_assets = await db.assets.find(creator_query, {"_id": 0, "royaltyEarnings": 1, "activeLicenses": 1}).to_list(500)
    royalty_earnings = round(sum(float(asset.get("royaltyEarnings", 0.0)) for asset in creator_assets), 2)
    active_licenses = sum(
        len([license for license in asset.get("activeLicenses", []) if license.get("status") == "active"])
        for asset in creator_assets
    )
    return {
        "totalAssets": total_assets,
        "totalNFTs": total_nfts,
        "processing": processing,
        "royaltyEarnings": royalty_earnings,
        "activeLicenses": active_licenses,
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await seed_demo_users()
    logger.info("Demo users seeded")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
