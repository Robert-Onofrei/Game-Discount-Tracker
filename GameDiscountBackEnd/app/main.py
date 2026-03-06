from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from datetime import datetime, timezone
from app.database import db
from fastapi.middleware.cors import CORSMiddleware

#CheapShark API for Deals

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def fetch_best_deal(game_id: str):
    url = "https://www.cheapshark.com/api/1.0/games"
    params = {"id": game_id}

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()

    deals = data.get("deals", [])
    if not deals:
        return None, None, None

    #Finds Cheapest Deal
    best = None
    best_price = None
    for d in deals:
        try:
            price = float(d.get("price"))
        except (TypeError, ValueError):
            continue

        if best_price is None or price < best_price:
            best_price = price
            best = d

    if best is None:
        return None, None, None

    store_map = await get_store_map()
    store_id = str(best.get("storeID"))
    store_name = store_map.get(store_id, f"Store {store_id}")

    deal_id = best.get("dealID")
    buy_link = f"https://www.cheapshark.com/redirect?dealID={deal_id}" if deal_id else None

    return best_price, store_name, buy_link

STORE_CACHE = {"loaded": False, "map": {}}

async def get_store_map():
    #Cached Meomry
    if STORE_CACHE["loaded"]:
        return STORE_CACHE["map"]

    url = "https://www.cheapshark.com/api/1.0/stores"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url)
        r.raise_for_status()
        stores = r.json()

    store_map = {}
    for s in stores:
        store_id = s.get("storeID")
        name = s.get("storeName")
        if store_id and name:
            store_map[str(store_id)] = name

    STORE_CACHE["map"] = store_map
    STORE_CACHE["loaded"] = True
    return store_map

#Used to test API and Mongo, had a few issues getting it to work so had few tests, Used http://127.0.0.1:8000/docs# for post requests
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/ping-mongo")
async def ping_mongo():
    result = await db.command("ping")
    return {"mongo": "ok", "result": result}

@app.get("/add-test")
async def add_test():
    await db.test.insert_one({"message": "hello from fastapi"})
    return {"inserted": True}

@app.get("/tests")
async def list_tests():
    docs = []
    async for d in db.test.find():
        d["_id"] = str(d["_id"])
        docs.append(d)
    return docs

CACHE_SECONDS = 24 * 60 * 60

@app.get("/search")
async def search_games(title: str = Query(..., min_length=2)):
    key = title.strip().lower()

    now_ts = int(datetime.now(timezone.utc).timestamp())

    #Tries cache first
    cached = await db.search_cache.find_one({"key": key})
    if cached:
        age_seconds = now_ts - int(cached.get("updated_at_ts", 0))
        if age_seconds < CACHE_SECONDS:
            return {
                "source": "cache",
                "key": key,
                "updated_at_ts": cached["updated_at_ts"],
                "results": cached["results"],
            }

    #Gets from CheapShark
    url = "https://www.cheapshark.com/api/1.0/games"
    params = {"title": title, "limit": 50}

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        results = r.json()

    #Store Update cache
    await db.search_cache.update_one(
        {"key": key},
        {"$set": {"key": key, "results": results, "updated_at_ts": now_ts}},
        upsert=True,
    )

    return {
        "source": "api",
        "key": key,
        "updated_at_ts": now_ts,
        "results": results,
    }

@app.get("/deals")
async def deals(sort: str = "title", page: int = 1, page_size: int = 20):
    #CheapShark API for deals
    url = "https://www.cheapshark.com/api/1.0/deals"
    params = {
        "pageNumber": max(page - 1, 0),
        "pageSize": min(max(page_size, 1), 60),
        "onSale": 1,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()

    if sort == "title":
        data.sort(key=lambda d: (d.get("title") or "").lower())
    elif sort == "biggest_discount":
        data.sort(key=lambda d: float(d.get("savings") or 0), reverse=True)

    return {"sort": sort, "page": page, "page_size": page_size, "results": data}

from pydantic import BaseModel, Field

USER_ID = "robert" #Will add accounts in future

class WishlistAdd(BaseModel):
    gameID: str
    title: str
    targetPrice: float = Field(gt=0)

@app.post("/wishlist")
async def add_to_wishlist(item: WishlistAdd):
    doc = {
        "userId": USER_ID,
        "gameID": item.gameID,
        "title": item.title,
        "targetPrice": item.targetPrice,
        "createdAtTs": int(datetime.now(timezone.utc).timestamp()),
    }

    #Stops dupes for same user + game
    await db.wishlist.update_one(
        {"userId": USER_ID, "gameID": item.gameID},
        {"$set": doc},
        upsert=True,
    )

    return {"saved": True, "gameID": item.gameID}

@app.get("/wishlist")
async def get_wishlist():
    items = []
    async for w in db.wishlist.find({"userId": USER_ID}).sort("createdAtTs", -1):
        w["_id"] = str(w["_id"])
        items.append(w)
    return items

@app.delete("/wishlist/{gameID}")
async def remove_from_wishlist(gameID: str):
    res = await db.wishlist.delete_one({"userId": USER_ID, "gameID": gameID})
    return {"deleted": res.deleted_count == 1}

@app.get("/wishlist/check")
async def check_wishlist_prices():
    items = []
    async for w in db.wishlist.find({"userId": USER_ID}):
        items.append(w)

    results = []
    for w in items:
        current_price, store_name, buy_link = await fetch_best_deal(w["gameID"])
        target = float(w["targetPrice"])

        is_deal = (current_price is not None) and (current_price <= target)

        results.append({
            "gameID": w["gameID"],
            "title": w.get("title"),
            "targetPrice": target,
            "currentPrice": current_price,
            "isDeal": is_deal,
            "storeName": store_name,
            "buyLink": buy_link,
            "checkedAtTs": int(datetime.now(timezone.utc).timestamp()),
        })

    results.sort(key=lambda x: (not x["isDeal"], x["currentPrice"] if x["currentPrice"] is not None else 999999))
    return results