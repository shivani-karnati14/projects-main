# Enrich Service (OCR enrichment microservice)

This microservice accepts OCR results (name, company, email, raw_text) and returns:
- possible company site info (title, description, found emails)
- candidate public LinkedIn profile URLs (via search engine results)

## Files
- `main.py` - FastAPI application (entrypoint)
- `requirements.txt` - Python dependencies
- `Dockerfile` - Build container image (includes Playwright browsers)
- `README.md` - this file

## Local setup (recommended for development)
1. Create & activate venv:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
