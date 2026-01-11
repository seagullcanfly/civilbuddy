import os
import json
import re
from docx import Document

# Paths
SPECS_DIR = r"C:\Users\seagu\civilbuddy\Clean_Specs_Docx"
SPECS_DATA_OUT = r"C:\Users\seagu\civilbuddy\src\specs_data.json"
RELATIONSHIPS_OUT = r"C:\Users\seagu\civilbuddy\src\relationships.json"

def extract_spec_info(file_path):
    try:
        doc = Document(file_path)
        full_text = "\n".join([para.text for para in doc.paragraphs])
        
        # Extract Title and Code from filename (e.g., "0009 - SUPPORT SERVICES SUPERVISOR.docx")
        filename = os.path.basename(file_path)
        code_match = re.match(r"(\d{4})", filename)
        code = code_match.group(1) if code_match else "0000"
        
        # Extract Title from filename or first line
        title = filename.replace(".docx", "")
        if " - " in title:
            title = title.split(" - ", 1)[1]
            
        # Extract Promotional Parents (Careers logic)
        parents = []
        # Search for text between PROMOTIONAL and the next major section
        match = re.search(r'PROMOTIONAL(.*?)(?:NECESSARY SPECIAL|SUFFOLK COUNTY|REVISION DATE|R\s?\d|Competitive|Full Performance)', full_text, re.IGNORECASE | re.DOTALL)
        if match:
            promo_part = match.group(1)
            # Find titles listed after "as a" or "as an"
            matches = list(re.finditer(r'\b(as\s+an?|as\s+a\(n\))\s*:?\s*', promo_part, re.IGNORECASE))
            for m in matches:
                after_text = promo_part[m.end():].strip()
                # Skip if it refers to the county itself
                if after_text.upper().startswith('SUFFOLK COUNTY') or after_text.upper().startswith('NON-COUNTY'):
                    continue
                
                # Take everything until the first period
                chunk = re.split(r'\.\s|\.$', after_text)[0]
                # Split by commas, 'or', or semicolons
                items = re.split(r',|\bor\b|;', chunk)
                for item in items:
                    clean = item.strip()
                    # Clean up common fragments
                    if clean.startswith('n ') and clean[2].isupper(): clean = clean[2:]
                    clean = re.sub(r'[;,]$', '', clean).strip()
                    if clean and len(clean) > 3 and not any(x in clean.upper() for x in ['SUFFOLK', 'THREE', 'TWO', 'ONE', 'YEAR']):
                        parents.append(clean)
        
        # Qualifications text (for the existing qual-specific parts of the UI if needed)
        qual_match = re.search(r'(?:OPEN COMPETITIVE|MINIMUM QUALIFICATIONS)(.*)', full_text, re.IGNORECASE | re.DOTALL)
        qual_text = qual_match.group(1).strip() if qual_match else ""

        return {
            "title": title,
            "code": code,
            "parents": list(set(parents)),
            "full_text": full_text,
            "qual_text": qual_text
        }
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

def main():
    all_specs = []
    relationships = []
    
    print(f"Scanning {SPECS_DIR}...")
    files = [f for f in os.listdir(SPECS_DIR) if f.endswith(".docx")]
    print(f"Found {len(files)} files.")

    for i, filename in enumerate(files):
        file_path = os.path.join(SPECS_DIR, filename)
        info = extract_spec_info(file_path)
        if info:
            all_specs.append({
                "title": info["title"],
                "parents": info["parents"],
                "qual_text": info["qual_text"],
                "full_text": info["full_text"]
            })
            relationships.append({
                "title": info["title"],
                "code": info["code"],
                "parents": info["parents"]
            })
            
        if (i + 1) % 100 == 0:
            print(f"Processed {i + 1}/{len(files)} files...")

    # Save to JSON
    with open(SPECS_DATA_OUT, "w", encoding="utf-8") as f:
        json.dump(all_specs, f, indent=2)
        
    with open(RELATIONSHIPS_OUT, "w", encoding="utf-8") as f:
        json.dump(relationships, f, indent=2)

    print(f"Done! Updated {SPECS_DATA_OUT} and {RELATIONSHIPS_OUT}")

if __name__ == "__main__":
    main()
