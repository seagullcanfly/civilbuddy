import { useState, useMemo } from 'react';
import Select from 'react-select';
import relationshipDataRaw from '../relationships.json';
import 'bootstrap/dist/css/bootstrap.min.css';

// Types
type SpecNode = { title: string; parents: string[] };
const relationshipData = relationshipDataRaw as SpecNode[];

export default function CareerMap() {
  const [selectedTitle, setSelectedTitle] = useState<{ value: string; label: string } | null>(null);

  // 1. Build the "Children" Map (Reverse Lookup)
  // Which titles list 'X' as a parent?
  const childrenMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    
    relationshipData.forEach(node => {
        node.parents.forEach(parentName => {
            // Clean up parent name for better matching (case insensitive, trim)
            const cleanParent = parentName.trim().toUpperCase();
            if (!map[cleanParent]) map[cleanParent] = [];
            
            // Add this node (Child) to the Parent's list
            if (!map[cleanParent].includes(node.title)) {
                map[cleanParent].push(node.title);
            }
        });
    });
    return map;
  }, []);

  // 2. Prepare Select Options
  const options = useMemo(() => {
    // Sort alphabetically
    return relationshipData
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(n => ({
            value: n.title,
            label: n.title
        }));
  }, []);

  // 3. Get Data for Selected Title
  const currentData = useMemo(() => {
      if (!selectedTitle) return null;
      
      const title = selectedTitle.value;
      
      // Find Parents (Directly from data)
      const node = relationshipData.find(n => n.title === title);
      const parents = node ? node.parents : [];

      // Find Children (From our reverse map)
      // Try exact match first, then fuzzy? For now exact/upper match.
      const children = childrenMap[title.toUpperCase()] || [];

      return { title, parents, children };
  }, [selectedTitle, childrenMap]);

  return (
    <div className="container mt-4" style={{ maxWidth: '1000px' }}>
      <div className="card shadow-lg border-0">
        <div className="card-header bg-warning text-dark text-center py-4">
          <h2 className="mb-0 fw-bold">Career Map</h2>
          <p className="mb-0 opacity-75">Explore Promotional Paths & Opportunities</p>
        </div>
        
        <div className="card-body p-4">
          
          <div className="mb-5">
            <label className="form-label fw-bold">Search for a Job Title</label>
            <Select 
                options={options} 
                onChange={setSelectedTitle}
                value={selectedTitle}
                placeholder="e.g. Office Assistant..."
                className="basic-single"
                isClearable
            />
          </div>

          {currentData ? (
             <div className="row g-4">
                 {/* COLUMN 1: WHERE YOU CAME FROM (PARENTS) */}
                 <div className="col-md-6">
                     <div className="card h-100 border-secondary">
                         <div className="card-header bg-secondary text-white fw-bold">
                             Promotes FROM (Parents)
                         </div>
                         <div className="card-body">
                             {currentData.parents.length > 0 ? (
                                 <ul className="list-group list-group-flush">
                                     {currentData.parents.map((p, idx) => (
                                         <li key={idx} className="list-group-item list-group-item-action cursor-pointer"
                                             onClick={() => setSelectedTitle({ value: p, label: p })}
                                             style={{cursor: 'pointer'}}
                                         >
                                             <i className="bi bi-arrow-up-circle me-2"></i>
                                             {p}
                                         </li>
                                     ))}
                                 </ul>
                             ) : (
                                 <p className="text-muted fst-italic">
                                     No promotional lines found leading TO this title. 
                                     (Likely an entry-level or open-competitive position).
                                 </p>
                             )}
                         </div>
                     </div>
                 </div>

                 {/* COLUMN 2: WHERE YOU CAN GO (CHILDREN) */}
                 <div className="col-md-6">
                     <div className="card h-100 border-success">
                         <div className="card-header bg-success text-white fw-bold">
                             Promotes TO (Children)
                         </div>
                         <div className="card-body">
                             {currentData.children.length > 0 ? (
                                 <ul className="list-group list-group-flush">
                                     {currentData.children.map((c, idx) => (
                                         <li key={idx} className="list-group-item list-group-item-action cursor-pointer"
                                             onClick={() => setSelectedTitle({ value: c, label: c })}
                                             style={{cursor: 'pointer'}}
                                         >
                                             <i className="bi bi-arrow-down-circle-fill text-success me-2"></i>
                                             {c}
                                         </li>
                                     ))}
                                 </ul>
                             ) : (
                                 <p className="text-muted fst-italic">
                                     No promotional lines found leading FROM this title.
                                     (This might be a top-level position or data is missing).
                                 </p>
                             )}
                         </div>
                     </div>
                 </div>
             </div>
          ) : (
              <div className="text-center py-5">
                  <div className="text-muted">
                      Select a title to see its career tree.
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
