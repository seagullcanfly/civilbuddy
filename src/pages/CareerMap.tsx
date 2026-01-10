import { useState, useMemo } from 'react';
import Select from 'react-select';
import relationshipDataRaw from '../relationships.json';
import 'bootstrap/dist/css/bootstrap.min.css';

// Types
type SpecNode = { title: string; code: string | null; parents: string[] };
const relationshipData = relationshipDataRaw as SpecNode[];

export default function CareerMap() {
  const [selectedTitle, setSelectedTitle] = useState<{ value: string; label: string } | null>(null);

  // 1. Build Lookup Maps
  // Map Title -> Code
  const codeMap = useMemo(() => {
      const map: Record<string, string> = {};
      relationshipData.forEach(n => {
          if (n.code) map[n.title.toUpperCase()] = n.code;
      });
      return map;
  }, []);

  // Map Parent -> Children (Reverse Lookup)
  const childrenMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    relationshipData.forEach(node => {
        node.parents.forEach(parentName => {
            const cleanParent = parentName.trim().toUpperCase();
            if (!map[cleanParent]) map[cleanParent] = [];
            if (!map[cleanParent].includes(node.title)) {
                map[cleanParent].push(node.title);
            }
        });
    });
    return map;
  }, []);

  // 2. Options
  const options = useMemo(() => {
    return relationshipData
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(n => ({
            value: n.title,
            label: n.title
        }));
  }, []);

  // 3. Current Data
  const currentData = useMemo(() => {
      if (!selectedTitle) return null;
      
      const title = selectedTitle.value;
      const node = relationshipData.find(n => n.title === title);
      const parents = node ? node.parents : [];
      const children = childrenMap[title.toUpperCase()] || [];
      const currentCode = node ? node.code : null;

      return { title, code: currentCode, parents, children };
  }, [selectedTitle, childrenMap]);

  // Helper to render a linked title
  const renderItem = (title: string, type: 'parent' | 'child') => {
      const code = codeMap[title.toUpperCase()];
      const url = code ? `https://apps2.suffolkcountyny.gov/civilservice/specs/${code}spe.html` : null;

      return (
          <li key={title} className="list-group-item d-flex justify-content-between align-items-center">
              <div 
                  className="flex-grow-1 cursor-pointer"
                  onClick={() => setSelectedTitle({ value: title, label: title })}
                  style={{cursor: 'pointer'}}
              >
                  {type === 'parent' ? (
                      <i className="bi bi-arrow-up-circle me-2 text-secondary"></i>
                  ) : (
                      <i className="bi bi-arrow-down-circle-fill me-2 text-success"></i>
                  )}
                  {title}
              </div>
              {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary ms-2" title="View Official Spec">
                      <i className="bi bi-file-earmark-text"></i> Spec
                  </a>
              )}
          </li>
      );
  };

  return (
    <div className="container mt-4" style={{ maxWidth: '1000px' }}>
      <div className="card shadow-lg border-0">
        <div className="card-header bg-warning text-dark text-center py-4">
          <h2 className="mb-0 fw-bold">Career Map</h2>
          <p className="mb-0 opacity-75">Explore Promotional Paths & Official Specs</p>
        </div>
        
        <div className="card-body p-4">
          
          <div className="mb-4">
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
             <div>
                 {/* Header for Selected Item */}
                 <div className="alert alert-light border d-flex justify-content-between align-items-center mb-4">
                     <h4 className="mb-0 text-dark">{currentData.title}</h4>
                     {currentData.code && (
                         <a 
                            href={`https://apps2.suffolkcountyny.gov/civilservice/specs/${currentData.code}spe.html`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                         >
                             <i className="bi bi-file-earmark-text me-2"></i>
                             View Official Spec
                         </a>
                     )}
                 </div>

                 <div className="row g-4">
                     {/* PARENTS */}
                     <div className="col-md-6">
                         <div className="card h-100 border-secondary">
                             <div className="card-header bg-secondary text-white fw-bold">
                                 Promotes FROM (Parents)
                             </div>
                             <div className="card-body p-0">
                                 {currentData.parents.length > 0 ? (
                                     <ul className="list-group list-group-flush">
                                         {currentData.parents.map(p => renderItem(p, 'parent'))}
                                     </ul>
                                 ) : (
                                     <div className="p-3 text-muted fst-italic">
                                         No promotional lines found leading TO this title.
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>

                     {/* CHILDREN */}
                     <div className="col-md-6">
                         <div className="card h-100 border-success">
                             <div className="card-header bg-success text-white fw-bold">
                                 Promotes TO (Children)
                             </div>
                             <div className="card-body p-0">
                                 {currentData.children.length > 0 ? (
                                     <ul className="list-group list-group-flush">
                                         {currentData.children.map(c => renderItem(c, 'child'))}
                                     </ul>
                                 ) : (
                                     <div className="p-3 text-muted fst-italic">
                                         No promotional lines found leading FROM this title.
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
          ) : (
              <div className="text-center py-5">
                  <div className="text-muted">
                      Select a title to see its career tree and access official documents.
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}