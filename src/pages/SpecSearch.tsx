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
}

interface CombinedSpec {
  title: string; // From spec (formatted) or title (caps)
  grade: string | null;
  specCode: number | null;
  qualText: string;
  parents: string[];
  educationTags: string[];
}

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
const normalize = (s: string) => s.trim().toLowerCase();

export default function SpecSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [educationFilters, setEducationFilters] = useState<string[]>([]);
  
  // Combine Data
  const combinedData: CombinedSpec[] = useMemo(() => {
    const titleMap = new Map<string, TitleDef>();
    (titlesData as TitleDef[]).forEach(t => titleMap.set(normalize(t.title), t));

    // Start with specsData as the base because it has the rich text
    const processed: CombinedSpec[] = (specsData as SpecDef[]).map(s => {
      const normTitle = normalize(s.title);
      const titleInfo = titleMap.get(normTitle);
      
      return {
        title: s.title, // Use the pretty capitalization from specs if available
        grade: titleInfo?.grade || null,
        specCode: titleInfo?.spec || null,
        qualText: s.qual_text,
        parents: s.parents,
        educationTags: getEducationTags(s.qual_text || "")
      };
    });

    // Note: If there are titles in titles.json that are NOT in specsData, they are skipped here.
    // This is acceptable as we can't search text for them anyway.
    
    return processed.sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  // Filter Data
  const filteredData = useMemo(() => {
    return combinedData.filter(item => {
      // 1. Text Search (Title or Content)
      const q = searchQuery.toLowerCase();
      const matchesText = !q || 
        item.title.toLowerCase().includes(q) || 
        item.qualText.toLowerCase().includes(q);

      if (!matchesText) return false;

      // 2. Grade Filter
      if (selectedGrade !== "All" && item.grade !== selectedGrade) return false;

      // 3. Education Filter (Must match ALL selected - AND logic? OR logic?)
      // Usually "OR" logic is better for checkboxes (e.g. show me jobs requiring Bach OR Master)
      if (educationFilters.length > 0) {
        const hasMatch = educationFilters.some(filter => item.educationTags.includes(filter));
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [combinedData, searchQuery, selectedGrade, educationFilters]);

  // Unique Grades for Dropdown
  const availableGrades = useMemo(() => {
    const grades = new Set(combinedData.map(d => d.grade).filter(Boolean));
    return Array.from(grades).sort((a, b) => {
        // Try numerical sort
        const numA = parseInt(a as string);
        const numB = parseInt(b as string);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return (a as string).localeCompare(b as string);
    });
  }, [combinedData]);

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

        {/* Grade Selector */}
        <div className="col-md-3">
          <label className="form-label fw-bold">Filter by Grade</label>
          <select 
            className="form-select" 
            value={selectedGrade} 
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option value="All">All Grades</option>
            {availableGrades.map(g => (
              <option key={g} value={g as string}>Grade {g}</option>
            ))}
          </select>
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
        {filteredData.slice(0, 100).map((item, idx) => (
          <div key={idx} className="list-group-item list-group-item-action p-3">
            <div className="d-flex w-100 justify-content-between">
              <h5 className="mb-1 text-primary">
                {item.specCode ? (
                    <a 
                        href={`https://apps2.suffolkcountyny.gov/civilservice/specs/${item.specCode}spe.html`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-decoration-none"
                    >
                        {item.title} <small className="text-muted">({item.specCode})</small>
                    </a>
                ) : (
                    item.title
                )}
              </h5>
              <small className="text-muted fw-bold">
                {item.grade ? `Grade ${item.grade}` : "Grade N/A"}
              </small>
            </div>
            
            <div className="mb-2">
                {item.educationTags.map(tag => (
                    <span key={tag} className="badge bg-info text-dark me-1">{tag}</span>
                ))}
            </div>

            <p className="mb-1 small text-muted" style={{ maxHeight: '100px', overflowY: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {item.qualText || "No qualification text available."}
            </p>

            {item.parents.length > 0 && (
                <div className="mt-2 small">
                    <strong>Promotes From: </strong>
                    {item.parents.join(", ")}
                </div>
            )}
          </div>
        ))}
      </div>
        
      {filteredData.length > 100 && (
        <div className="alert alert-info mt-3 text-center">
            Showing first 100 results. Please refine your search.
        </div>
      )}
    </div>
  );
}
