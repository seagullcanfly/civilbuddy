import { useState, useMemo } from 'react';
import titlesData from '../titles.json';
import specsData from '../specs_data.json';

// Types
interface TitleDef {
  title: string;
  grade: string;
  spec: number;
}

interface SpecDef {
  title: string;
  parents: string[];
  qual_text: string;
  full_text?: string;
}

interface CombinedSpec {
  title: string;
  grade: string | null;
  specCode: number | null;
  qualText: string;
  fullText: string;
  parents: string[];
  educationTags: string[];
  gradeNum: number | null;
}

// Helper: Format Spec Code
const formatSpecCode = (code: number | null) => {
    if (code === null) return "";
    return code.toString().padStart(4, '0');
};

// Helper: Get Highlight Snippet
const getHighlightSnippet = (text: string, query: string) => {
    if (!query || !text) return text.substring(0, 200) + "...";
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text.substring(0, 200) + "..."; // Fallback if not found (shouldn't happen if filtered)
    
    const start = Math.max(0, index - 60);
    const end = Math.min(text.length, index + query.length + 100);
    const snippet = text.substring(start, end);
    
    // Highlight
    const parts = snippet.split(new RegExp(`(${query})`, 'gi'));
    
    return (
        <span>
            {start > 0 && "..."}
            {parts.map((part, i) => 
                part.toLowerCase() === lowerQuery ? 
                <mark key={i} className="bg-warning">{part}</mark> : 
                part
            )}
            {end < text.length && "..."}
        </span>
    );
};


// Heuristic for Education Tags
const getEducationTags = (text: string): string[] => {
  const lower = text.toLowerCase();
  const tags = new Set<string>();
  
  if (lower.includes("high school") || lower.includes("ged") || lower.includes("equivalency diploma")) tags.add("High School / GED");
  if (lower.includes("associate") || lower.includes("associate's")) tags.add("Associate's");
  if (lower.includes("bachelor") || lower.includes("bachelor's")) tags.add("Bachelor's");
  if (lower.includes("master") || lower.includes("master's")) tags.add("Master's");
  if (lower.includes("doctorate") || lower.includes("ph.d") || lower.includes("juris doctor")) tags.add("Doctorate / JD");
  
  return Array.from(tags);
};

// Normalize title for matching
const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export default function SpecSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [minGrade, setMinGrade] = useState<number>(0);
  const [maxGrade, setMaxGrade] = useState<number>(40);
  const [educationFilters, setEducationFilters] = useState<string[]>([]);
  
  // Combine Data
  const combinedData: CombinedSpec[] = useMemo(() => {
    const titleMap = new Map<string, TitleDef>();
    (titlesData as TitleDef[]).forEach(t => titleMap.set(normalize(t.title), t));

    // Start with specsData as the base because it has the rich text
    const processed: CombinedSpec[] = (specsData as SpecDef[]).map(s => {
      const normTitle = normalize(s.title);
      const titleInfo = titleMap.get(normTitle);
      
      const gradeStr = titleInfo?.grade || null;
      const gradeNum = gradeStr ? parseInt(gradeStr, 10) : null;

      return {
        title: s.title, 
        grade: gradeStr,
        gradeNum: isNaN(gradeNum || NaN) ? null : gradeNum,
        specCode: titleInfo?.spec || null,
        qualText: s.qual_text || "",
        fullText: s.full_text || s.qual_text || "",
        parents: s.parents || [],
        educationTags: getEducationTags(s.qual_text || "")
      };
    });

    return processed.sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  // Filter Data
  const filteredData = useMemo(() => {
    return combinedData.filter(item => {
      // 1. Text Search (Title or Content)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesText = 
          item.title.toLowerCase().includes(q) || 
          item.fullText.toLowerCase().includes(q);

        if (!matchesText) return false;
      }

      // 2. Grade Range Filter
      // If Min/Max are at "default" extremes (0 and 40), we can be lenient with UNG
      // But if user tightens range, we exclude nulls
      if (item.gradeNum !== null) {
          if (item.gradeNum < minGrade) return false;
          if (item.gradeNum > maxGrade) return false;
      } else {
          // It's un-graded (UNG). Hide if range is specific?
          // Let's hide UNG only if user moved the sliders
          if (minGrade > 0 || maxGrade < 40) return false;
      }

      // 3. Education Filter
      if (educationFilters.length > 0) {
        const hasMatch = educationFilters.some(filter => item.educationTags.includes(filter));
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [combinedData, searchQuery, minGrade, maxGrade, educationFilters]);

  const toggleEducationFilter = (tag: string) => {
    setEducationFilters(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const eduOptions = ["High School / GED", "Associate's", "Bachelor's", "Master's", "Doctorate / JD"];

  return (
    <div className="container py-4">
      <h1 className="mb-4">Specification Search</h1>
      
      <div className="row g-3 mb-4">
        {/* Search Bar */}
        <div className="col-md-6">
            <label className="form-label fw-bold">Keyword Search</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by title, qualifications, or keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {/* Grade Range Sliders */}
        <div className="col-md-6">
          <label className="form-label fw-bold">Grade Range: {minGrade} - {maxGrade}</label>
          <div className="d-flex align-items-center gap-3">
             <div className="flex-grow-1">
                 <input 
                    type="range" 
                    className="form-range" 
                    min="0" 
                    max="40" 
                    value={minGrade} 
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setMinGrade(Math.min(val, maxGrade)); // Prevent crossing
                    }}
                 />
                 <small className="text-muted d-block text-center">Min: {minGrade}</small>
             </div>
             <div className="flex-grow-1">
                 <input 
                    type="range" 
                    className="form-range" 
                    min="0" 
                    max="40" 
                    value={maxGrade} 
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setMaxGrade(Math.max(val, minGrade)); // Prevent crossing
                    }}
                 />
                 <small className="text-muted d-block text-center">Max: {maxGrade}</small>
             </div>
          </div>
        </div>
      </div>

      {/* Education Filters */}
      <div className="mb-4">
        <label className="form-label fw-bold d-block">Education Requirements (Estimated)</label>
        <div className="btn-group flex-wrap" role="group">
          {eduOptions.map(tag => (
            <button
                key={tag}
                type="button"
                className={`btn btn-outline-primary ${educationFilters.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleEducationFilter(tag)}
            >
                {tag}
            </button>
          ))}
        </div>
        <div className="form-text mt-1">
            Note: These filters are estimated based on keywords in the specification text.
        </div>
      </div>

      {/* Results Count */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="text-muted">{filteredData.length} Results Found</h5>
      </div>

      {/* Results List */}
      <div className="list-group shadow-sm">
        {filteredData.slice(0, 100).map((item, idx) => {
          const formattedCode = formatSpecCode(item.specCode);
          return (
            <div key={idx} className="list-group-item list-group-item-action p-3">
                <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1 text-primary">
                    {item.specCode ? (
                        <a 
                            href={`https://apps2.suffolkcountyny.gov/civilservice/specs/${formattedCode}spe.html`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-decoration-none"
                        >
                            {item.title} <small className="text-muted">({formattedCode})</small>
                        </a>
                    ) : (
                        item.title
                    )}
                </h5>
                <div className="text-end">
                    <span className="badge bg-secondary">
                        {item.grade ? `Grade ${item.grade}` : "Grade N/A"}
                    </span>
                </div>
                </div>
                
                <div className="mb-2">
                    {item.educationTags.map(tag => (
                        <span key={tag} className="badge bg-info text-dark me-1">{tag}</span>
                    ))}
                </div>

                <p className="mb-1 small text-muted">
                    {/* Show highlight snippet if searching, otherwise full qual text truncated */}
                    {searchQuery ? getHighlightSnippet(item.fullText, searchQuery) : (
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.qualText || "No description available."}
                        </span>
                    )}
                </p>

                {item.parents.length > 0 && (
                    <div className="mt-2 small">
                        <strong>Promotes From: </strong>
                        {item.parents.join(", ")}
                    </div>
                )}
            </div>
          );
        })}
      </div>
        
      {filteredData.length > 100 && (
        <div className="alert alert-info mt-3 text-center">
            Showing first 100 results. Please refine your search.
        </div>
      )}
    </div>
  );
}
