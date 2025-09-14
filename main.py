# app.py
import os, base64, uuid, json, argparse, mimetypes, pathlib
from typing import List, Optional
from fastapi import FastAPI, UploadFile, Form, File
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI

# 优先使用系统环境变量，如果不存在则从.env文件加载
if not os.getenv("OPENAI_API_KEY"):
    load_dotenv()  # 只有在系统环境变量不存在时才加载.env文件

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- Define your tool / function schema (JSON Schema) ---
# Added: user_allergies (top-level), and dish-level allergy_alert.
# allergy_alert is model-inferred wrt user_allergies; values: "safe", "contains", "may_contain", "unknown".
RETURN_MENU_TOOL = {
    "type": "function",
    "name": "return_menu",  # <-- top-level name is REQUIRED
    "description": "Return structured menu information from images and/or OCR text. Translate output fields into the target language.",
    "parameters": {  # <-- JSON Schema exactly as you had tagore
        "type": "object",
        "properties": {
            "menu_language": {"type": "string"},
            "target_language": {"type": "string"},
            "currency": {"type": "string"},
            "user_allergies": {
                "type": "array",
                "items": {"type": "string"},
                "description": "User-declared allergens (e.g., peanut, shellfish, gluten). May be empty."
            },
            "dishes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["name", "ingredients"],
                    "properties": {
                        "dish_id": {"type": "string"},
                        "name": {
                            "type": "object",
                            "properties": {
                                "src": {"type": "string"},
                                "translated": {"type": "string", "description": "Name translated to target_language"}
                            }
                        },
                        "aliases": {"type": "array", "items": {"type": "string"}},
                        "description": {
                            "type": "object",
                            "properties": {
                                "src": {"type": "string"},
                                "translated": {"type": "string", "description": "Description translated to target_language"}
                            }
                        },
                        "price": {
                            "type": "object",
                            "properties": {
                                "amount": {"type": "number"},
                                "currency": {"type": "string"}
                            }
                        },
                        "ingredients": {"type": "array", "items": {"type": "string"}},
                        "flavor_profile": {"type": "array", "items": {"type": "string"}},
                        "dietary": {
                            "type": "object",
                            "properties": {
                                "contains_allergens": {"type": "array", "items": {"type": "string"}},
                                "vegetarian": {"type": "boolean"},
                                "vegan": {"type": "boolean"},
                                "gluten_free": {"type": "string"},
                                "halal": {"type": "string"}
                            }
                        },
                        "kids_friendly": {"type": "string", "enum": ["yes","no","caution_spicy","unknown"]},
                        "spice_level": {"type": "integer", "minimum": 0, "maximum": 3},
                        "allergy_alert": {
                            "type": "string",
                            "enum": ["safe","contains","may_contain","unknown"],
                            "description": "Model judgment relative to user_allergies."
                        },
                        "confidence": {"type": "number"},
                        "evidence": {
                            "type": "object",
                            "properties": {
                                "image_refs": {"type": "array", "items": {"type": "integer"}},
                                "ocr_spans": {"type": "array", "items": {"type": "string"}}
                            }
                        }
                    }
                }
            },
            "notes": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["menu_language", "target_language", "dishes"]
    }
}


app = FastAPI(title="Menu Translator API", description="AI-powered menu translation and analysis")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files directly
@app.get("/styles.css")
async def get_styles():
    return FileResponse("styles.css", media_type="text/css")

@app.get("/script.js")
async def get_script():
    return FileResponse("script.js", media_type="application/javascript")

@app.get("/manifest.json")
async def get_manifest():
    return FileResponse("manifest.json")

@app.get("/sw.js")
async def get_service_worker():
    return FileResponse("sw.js", media_type="application/javascript")

@app.get("/icons/{filename}")
async def get_icon(filename: str):
    return FileResponse(f"icons/{filename}")

# Root endpoint to serve the main page
@app.get("/")
async def read_root():
    return FileResponse("index.html")

def to_image_part(file_bytes: bytes, mime="image/jpeg"):
    b64 = base64.b64encode(file_bytes).decode("utf-8")
    return {"type": "input_image", "image_url": f"data:{mime};base64,{b64}"}

def _extract_tool_args(resp):
    """
    Extract function/tool call args from Responses API output.
    Returns a dict or None.
    """
    tool_args = None
    # Newer SDK: items in resp.output may contain function_call
    for item in getattr(resp, "output", []) or []:
        if getattr(item, "type", None) == "function_call" and getattr(item, "name", "") == "return_menu":
            args = item.arguments
            if isinstance(args, str):
                return json.loads(args)
            return args
        # Some SDK variants: nested content with tool_call
        for c in getattr(item, "content", []) or []:
            if getattr(c, "type", None) in ("tool_call","function_call") and getattr(c, "tool_name", getattr(c, "name", "")) == "return_menu":
                args = getattr(c, "arguments", None)
                if isinstance(args, str):
                    return json.loads(args)
                return args
    return tool_args

def _render_html(menu_json: dict) -> str:
    """Create a simple HTML report from structured JSON."""
    tg = menu_json.get("target_language", "en")
    currency = menu_json.get("currency", "")
    user_allergies = menu_json.get("user_allergies", []) or []
    dishes = menu_json.get("dishes", [])

    def badge(text):
        return f'<span style="display:inline-block;padding:2px 8px;border-radius:12px;background:#eee;margin-right:6px;font-size:12px;">{text}</span>'

    allergy_badge_map = {
        "safe": "#16a34a",
        "contains": "#dc2626",
        "may_contain": "#f59e0b",
        "unknown": "#6b7280",
    }

    cards = []
    for d in dishes:
        name = d.get("name", {})
        desc = d.get("description", {})
        price = d.get("price", {})
        fp = d.get("flavor_profile", []) or []
        dietary = d.get("dietary", {}) or {}
        contains = dietary.get("contains_allergens", []) or []
        kids = d.get("kids_friendly", "unknown")
        spice = d.get("spice_level", 0)
        aa = d.get("allergy_alert", "unknown")
        aa_color = allergy_badge_map.get(aa, "#6b7280")

        chips = []
        if kids != "unknown":
            chips.append(f"kids: {kids}")
        if spice is not None:
            chips.append(f"spice:{spice}")
        for t in fp:
            chips.append(t)
        if dietary.get("vegetarian") is True:
            chips.append("vegetarian")
        if dietary.get("vegan") is True:
            chips.append("vegan")

        chips_html = " ".join(badge(c) for c in chips)
        allergens_line = ", ".join(contains) if contains else "—"

        card = f"""
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0 0 8px 0;">{name.get('translated') or name.get('src') or 'Dish'}</h3>
            <span style="background:{aa_color};color:white;padding:4px 10px;border-radius:12px;font-size:12px;">allergy: {aa}</span>
          </div>
          <div style="color:#6b7280;margin-bottom:6px;">{name.get('src','')}</div>
          <div style="margin:8px 0 12px 0;">{desc.get('translated') or desc.get('src') or ''}</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px;">
            <div><strong>Allergens (detected):</strong> {allergens_line}</div>
            <div><strong>Price:</strong> {price.get('amount','')} {price.get('currency', currency) or ''}</div>
          </div>
          <div>{chips_html}</div>
        </div>
        """
        cards.append(card)

    ua = ", ".join(user_allergies) if user_allergies else "None declared"
    html = f"""
    <!doctype html>
    <html lang="{tg}">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Menu Analysis</title>
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 24px; color:#111827; }}
      </style>
    </head>
    <body>
      <h1 style="margin-bottom:6px;">Menu analysis</h1>
      <div style="color:#6b7280;margin-bottom:18px;">
        Target language: <strong>{tg}</strong> · Currency: <strong>{currency or '—'}</strong> · Your allergies: <strong>{ua}</strong>
      </div>
      {"".join(cards) or "<p>No dishes parsed.</p>"}
      <p style="margin-top:24px;color:#6b7280;font-size:12px;">Allergy alerts are best-effort; verify with restaurant staff if you have severe allergies.</p>
    </body>
    </html>
    """
    return html

def _build_content_parts(target_language: str, user_allergies: List[str], ocr_text: Optional[str], currency: Optional[str], image_blobs: List[bytes], mimes: List[str]):
    # System/user guidance:
    instructions = (
        "You are a culinary menu expert. Extract dishes from the provided images and/or OCR text. "
        "Infer allergens conservatively. Translate dish names and descriptions into the target language. "
        "Given user_allergies, assign a per-dish 'allergy_alert' as one of: safe, contains, may_contain, unknown. "
        "If ingredients clearly include a user allergen -> 'contains'. If uncertain wording suggests possible presence "
        "(e.g., 'may contain traces', 'sauce may include peanuts') -> 'may_contain'. If explicit absence -> 'safe'. "
        "Else 'unknown'. Return ONLY the function call 'return_menu' with JSON matching the schema."
    )
    parts = [
        {"type": "input_text", "text": instructions},
        {"type": "input_text", "text": f"target_language={target_language}"},
        {"type": "input_text", "text": f"user_allergies={','.join([a.strip() for a in user_allergies]) if user_allergies else ''}"},
    ]
    if currency:
        parts.append({"type": "input_text", "text": f"currency={currency}"})
    if ocr_text:
        parts.append({"type": "input_text", "text": f"OCR:\n{ocr_text}"})
    for blob, mime in zip(image_blobs, mimes):
        parts.append(to_image_part(blob, mime=mime or "image/jpeg"))
    return parts

def call_model(content_parts):

    resp = client.responses.create(
        model="gpt-4o-mini",
        input=[{"role": "user", "content": content_parts}],
        tools=[RETURN_MENU_TOOL],
        tool_choice={"type": "function", "name": "return_menu"},  # <-- top-level name here too
        temperature=0.2,
    )
    tool_args = _extract_tool_args(resp)
    if tool_args is None:
        return None, resp
    # attach request id for observability
    tool_args["request_id"] = getattr(resp, "_request_id", f"req_{uuid.uuid4().hex[:8]}")
    return tool_args, resp

@app.post("/analyze_menu")
async def analyze_menu(
    target_language: str = Form(...),
    ocr_text: Optional[str] = Form(None),
    currency: Optional[str] = Form(None),
    allergy_info: Optional[str] = Form(None),  # comma-separated list, optional
    images: List[UploadFile] = File(None)
):
    user_allergies = [a.strip() for a in (allergy_info or "").split(",") if a.strip()]
    # Build multimodal input: text + images
    blobs, mimes = [], []
    for f in images:
        data = await f.read()
        blobs.append(data)
        mimes.append(f.content_type or "image/jpeg")

    content_parts = _build_content_parts(target_language, user_allergies, ocr_text, currency, blobs, mimes)

    tool_args, raw = call_model(content_parts)
    if tool_args is None:
        return JSONResponse({"error": "No tool call returned", "raw": raw.model_dump()}, status_code=502)
    return JSONResponse(tool_args)

# ------------------------- CLI runner -------------------------

def read_image_file(path: str) -> bytes:
    with open(path, "rb") as f:
        return f.read()

def guess_mime(path: str) -> str:
    mt, _ = mimetypes.guess_type(path)
    return mt or "image/jpeg"

def save_files(menu_json: dict, out_prefix: str = "menu_result"):
    json_path = f"{out_prefix}.json"
    html_path = f"{out_prefix}.html"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(menu_json, f, ensure_ascii=False, indent=2)
    html = _render_html(menu_json)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    return json_path, html_path

def main():
    parser = argparse.ArgumentParser(description="Analyze menu images → structured JSON + HTML")
    parser.add_argument("--images", nargs="+", required=True, help="Path(s) to menu image(s)")
    parser.add_argument("--target-language", default="en", help="Target language code/name (default: en)")
    parser.add_argument("--allergies", default="", help='Comma-separated allergies, e.g. "peanut,shellfish" (optional)')
    parser.add_argument("--currency", default="", help="Currency code, e.g. CNY, EUR (optional)")
    parser.add_argument("--ocr-text", default="", help="Optional OCR text to include")
    parser.add_argument("--out-prefix", default="menu_result", help="Output file prefix for JSON/HTML")
    args = parser.parse_args()

    # Inputs
    user_allergies = [a.strip() for a in args.allergies.split(",") if a.strip()]
    image_paths = [p for p in args.images if p]
    blobs = [read_image_file(p) for p in image_paths]
    mimes = [guess_mime(p) for p in image_paths]
    ocr_text = args.ocr_text or None
    currency = args.currency or None

    content_parts = _build_content_parts(
        target_language=args.target_language,
        user_allergies=user_allergies,
        ocr_text=ocr_text,
        currency=currency,
        image_blobs=blobs,
        mimes=mimes,
    )

    menu_json, raw = call_model(content_parts)
    if menu_json is None:
        print("Model did not return a tool call. Raw response below:")
        print(raw)
        return

    # Ensure top-level repeats target_language and user_allergies for rendering clarity
    menu_json.setdefault("target_language", args.target_language)
    menu_json.setdefault("user_allergies", user_allergies)
    if currency and "currency" not in menu_json:
        menu_json["currency"] = currency

    jpath, hpath = save_files(menu_json, out_prefix=args.out_prefix)
    print(f"Saved JSON -> {jpath}")
    print(f"Saved HTML -> {hpath}")
    print("Open the HTML in a browser to preview.")

if __name__ == "__main__":
    main()
