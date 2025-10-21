# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import httpx
from bs4 import BeautifulSoup
import re
import time
from urllib.parse import urlparse, quote
app = FastAPI(title="ocr-enrich-service", version="0.1")
class OCRInput(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    raw_text: Optional[str] = None

def simple_extract_domain(url: str) -> str:
    try:
        p = urlparse(url)
        if p.netloc:
            return p.netloc
        # fallback if full scheme missing
        p2 = urlparse("https://" + url)
        return p2.netloc
    except Exception:
        return url

def fetch_company_info(domain: str, timeout=8) -> Dict[str,Any]:
    if not domain:
        return {}
    # try common prefixes
    candidates = [f"https://{domain}", f"http://{domain}"]
    for url in candidates:
        try:
            resp = httpx.get(url, follow_redirects=True, timeout=timeout)
            if resp.status_code != 200:
                continue
            soup = BeautifulSoup(resp.text, "html.parser")
            title = (soup.title.string.strip() if soup.title else None)
            desc = None
            m = soup.find("meta", {"name":"description"}) or soup.find("meta", {"property":"og:description"})
            if m:
                desc = m.get("content")
            emails = set(re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", resp.text))
            return {"url": url, "status": resp.status_code, "title": title, "description": desc, "emails": list(emails)}
        except Exception as e:
            # try next candidate
            continue
    return {"error": "could not fetch site or non-200 responses"}

def parse_google_search(page, max_results=5):
    results = []
    blocks = page.query_selector_all("div.g")
    for it in blocks[:max_results]:
        try:
            a = it.query_selector("a")
            if not a:
                continue
            href = a.get_attribute("href")
            
            # Skip Google redirects and non-LinkedIn URLs for LinkedIn searches
            if href and href.startswith("/url?q="):
                # Extract actual URL from Google redirect
                import urllib.parse
                parsed = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
                if 'q' in parsed:
                    href = parsed['q'][0]
            
            title_el = it.query_selector("h3")
            title = title_el.inner_text().strip() if title_el else None
            
            # Try multiple selectors for snippet
            snippet_el = (it.query_selector("span.aCOpRe") or 
                         it.query_selector("div.IsZvec") or 
                         it.query_selector("div.VwiC3b") or
                         it.query_selector("span.st"))
            snippet = snippet_el.inner_text().strip() if snippet_el else None
            
            # Only include LinkedIn results for LinkedIn searches
            if href and "linkedin.com/in/" in href:
                results.append({
                    "url": href, 
                    "title": title, 
                    "snippet": snippet, 
                    "source": "google",
                    "type": "linkedin_profile"
                })
        except Exception as e:
            print(f"Error parsing Google result: {e}")
            continue
    return results

def parse_bing_search(page, max_results=5):
    results = []
    blocks = page.query_selector_all("li.b_algo")
    for it in blocks[:max_results]:
        try:
            a = it.query_selector("h2 > a")
            href = a.get_attribute("href") if a else None
            title = a.inner_text().strip() if a else None
            snippet_el = it.query_selector("p")
            snippet = snippet_el.inner_text().strip() if snippet_el else None
            results.append({"url": href, "title": title, "snippet": snippet, "source": "bing"})
        except Exception:
            continue
    return results 
def search_public(query: str, engine: str = "bing", max_results: int = 5) -> List[Dict[str,Any]]:
    """
    Uses Playwright to perform a search and scrape top results.
    NOTE: headless browser usage can be heavier on resources but is more robust to JS sites.
    """
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({"accept-language":"en-US,en;q=0.9"})
        q = quote(query)
        try:
            if engine == "google":
                url = f"https://www.google.com/search?q={q}"
                page.goto(url, timeout=15000)
                results = parse_google_search(page, max_results)
            else:  # default bing
                url = f"https://www.bing.com/search?q={q}"
                page.goto(url, timeout=15000)
                results = parse_bing_search(page, max_results)
        except PlaywrightTimeout:
            # timeout -> return what we have
            pass
        except Exception:
            pass
        finally:
            browser.close()
    return results

def extract_linkedin_profile_info(profile_url: str) -> Dict[str, Any]:
    """Extract basic information from LinkedIn profile page"""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_extra_http_headers({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            })
            
            try:
                page.goto(profile_url, timeout=15000)
                page.wait_for_load_state("networkidle", timeout=10000)
                
                # Extract basic info
                profile_data = {
                    "url": profile_url,
                    "name": None,
                    "title": None,
                    "location": None,
                    "company": None,
                    "connections": None,
                    "summary": None
                }
                
                # Try to extract name
                name_el = page.query_selector("h1.text-heading-xlarge")
                if name_el:
                    profile_data["name"] = name_el.inner_text().strip()
                
                # Try to extract title/headline
                title_el = page.query_selector(".text-body-medium.break-words")
                if title_el:
                    profile_data["title"] = title_el.inner_text().strip()
                
                # Try to extract location
                location_el = page.query_selector(".text-body-small.inline.t-black--light.break-words")
                if location_el:
                    profile_data["location"] = location_el.inner_text().strip()
                
                return profile_data
                
            except Exception as e:
                print(f"Error extracting LinkedIn profile info: {e}")
                return {"url": profile_url, "error": str(e)}
            finally:
                browser.close()
                
    except Exception as e:
        print(f"Error in LinkedIn profile extraction: {e}")
        return {"url": profile_url, "error": str(e)}

def search_linkedin_by_name(name: str, company: Optional[str]=None, max_results:int=5):
    """Enhanced LinkedIn search with better query construction"""
    # Clean and format the name
    name_parts = name.strip().split()
    if len(name_parts) >= 2:
        # Use first and last name for better results
        query = f'site:linkedin.com/in "{name_parts[0]} {name_parts[-1]}"'
    else:
        query = f'site:linkedin.com/in "{name}"'
    
    if company:
        # Add company to the query
        query += f' "{company.strip()}"'
    
    print(f"LinkedIn search query: {query}")  # Debug log
    return search_public(query, engine="google", max_results=max_results)

@app.get("/")
def root():
    return {"message": "OCR Enrich Service", "version": "0.1", "endpoints": ["/enrich", "/test-linkedin"]}

@app.post("/test-linkedin")
def test_linkedin_search(name: str, company: str = None):
    """Test endpoint for LinkedIn search functionality"""
    try:
        results = search_linkedin_by_name(name, company, max_results=3)
        return {
            "query": f"name: {name}, company: {company}",
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/enrich")
def enrich(input: OCRInput):
    start = time.time()
    name = (input.name or "").strip()
    company = (input.company or "").strip() if input.company else None

    # 1) company search (try to find domain via search)
    company_search_results = []
    candidate_domain = None
    if company:
        company_search_results = search_public(company, engine="bing", max_results=6)
        for r in company_search_results:
            url = r.get("url") or ""
            if not url:
                continue
            # skip some known aggregator sites
            lower = url.lower()
            if any(skip in lower for skip in ("linkedin.com", "glassdoor.com", "crunchbase.com", "yellowpages", "indeed.com")):
                continue
            candidate_domain = url
            break

    company_info = {}
    if candidate_domain:
        # normalize google redirect style if present (/url?q=...)
        if candidate_domain.startswith("/url?q="):
            m = re.search(r"/url\?q=(https?://[^&]+)", candidate_domain)
            if m:
                candidate_domain = m.group(1)
        domain_netloc = simple_extract_domain(candidate_domain)
        company_info = fetch_company_info(domain_netloc)

    # 2) LinkedIn candidates
    linkedin_results = []
    linkedin_profiles = []
    
    if name:  # Only search if we have a name
        print(f"Searching LinkedIn for: {name} at {company}")
        linkedin_search_results = search_linkedin_by_name(name, company, max_results=3)
        linkedin_results = linkedin_search_results
        
        # Extract detailed info from top LinkedIn profiles
        for result in linkedin_search_results[:2]:  # Limit to top 2 profiles
            if result.get("url") and "linkedin.com/in/" in result["url"]:
                print(f"Extracting details from: {result['url']}")
                profile_info = extract_linkedin_profile_info(result["url"])
                linkedin_profiles.append(profile_info)

    elapsed = time.time() - start
    return {
        "input": input.dict(),
        "company_search_results": company_search_results,
        "company_info": company_info,
        "linkedin_candidates": linkedin_results,
        "linkedin_profiles": linkedin_profiles,
        "meta": {
            "elapsed_seconds": elapsed,
            "linkedin_profiles_found": len(linkedin_profiles),
            "total_results": len(linkedin_results)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


