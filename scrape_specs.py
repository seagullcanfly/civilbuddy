import json
import re
import time
import random
from playwright.sync_api import sync_playwright

# Configuration
BASE_URL = "https://apps2.suffolkcountyny.gov/civilservice/specs/"
INDEX_URL = "https://apps2.suffolkcountyny.gov/civilservice/civilserviceinquiry/AllTitlesAction.aspx"

def extract_promotional_from_html(html_content):
    """Parses the raw HTML spec page to find promotional lines."""
    # Find the text after 'PROMOTIONAL' but before the next section/footer
    # Usually these pages are very simple HTML.
    
    # Strip HTML tags to get clean text
    text = re.sub('<[^<]+?>', '', html_content)
    
    parents = []
    # Search for promotional section
    match = re.search(r'PROMOTIONAL(.*?)(?:NECESSARY SPECIAL|SUFFOLK COUNTY|REVISION DATE|R\s?\d|Competitive)', text, re.IGNORECASE | re.DOTALL)
    if match:
        promo_part = match.group(1)
        # Use our "Smart" logic from the docx parser
        matches = list(re.finditer(r'\b(as\s+an?|as\s+a\(n\))\s*:?\s*', promo_part, re.IGNORECASE))
        for m in matches:
            after_text = promo_part[m.end():].strip()
            if after_text.upper().startswith('SUFFOLK COUNTY') or after_text.upper().startswith('NON-COUNTY'):
                continue
            
            chunk = re.split(r'\.\s|\.$', after_text)[0]
            items = re.split(r',|\bor\b|;', chunk)
            for item in items:
                clean = item.strip().replace('\n', ' ')
                if clean.startswith('n ') and clean[2].isupper(): clean = clean[2:]
                clean = re.sub(r'[;,]$', '', clean).strip()
                if clean and len(clean) > 3 and not any(x in clean.upper() for x in ['SUFFOLK', 'THREE', 'TWO']):
                    parents.append(clean)
    
    return list(set(parents))

def run_scraper():
    all_data = []
    
    with sync_playwright() as p:
        # Launch browser in stealth mode
        browser = p.chromium.launch(headless=True)
        # Use a real browser context
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        print(f"Accessing index: {INDEX_URL}")
        try:
            page.goto(INDEX_URL, wait_until="networkidle", timeout=60000)
            # Find all spec links (they usually contain 'specs/' and end in 'spe.html')
            links = page.query_selector_all("a[href*='specs/']")
            codes = []
            for link in links:
                href = link.get_attribute("href")
                code_match = re.search(r'(\d{4})spe\.html', href)
                if code_match:
                    codes.append(code_match.group(1))
            
            codes = list(set(codes)) # Unique codes
            print(f"Found {len(codes)} spec codes to scrape.")

            # To avoid detection, we scrape in batches with delays
            for i, code in enumerate(codes):
                spec_url = f"{BASE_URL}{code}spe.html"
                try:
                    page.goto(spec_url, wait_until="domcontentloaded")
                    title = page.locator("h1, h2, b").first.inner_text().strip()
                    # Clean title (remove the code if present)
                    title = re.sub(r'\s{2,}\d{4}$', '', title).strip()
                    
                    html = page.content()
                    parents = extract_promotional_from_html(html)
                    
                    all_data.append({
                        "title": title,
                        "code": code,
                        "parents": parents
                    })
                    
                    if i % 10 == 0:
                        print(f"[{i}/{len(codes)}] Scraped: {title}")
                    
                    # Random delay between 1-3 seconds to look human
                    time.sleep(random.uniform(1, 3))
                    
                except Exception as e:
                    print(f"Error scraping {code}: {e}")

        except Exception as e:
            print(f"Failed to access index: {e}")

        browser.close()

    # Save results
    with open("relationships.json", "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=2)
    print("Scraping complete. relationships.json updated.")

if __name__ == "__main__":
    run_scraper()
