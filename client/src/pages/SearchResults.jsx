import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Search, FileText, BookOpen, ClipboardList, Store, Building, ArrowRight } from 'lucide-react';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState({ announcements: [], guidelines: [], activities: [], vendors: [], amenities: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    api.get('/search', { params: { q: query } })
      .then(res => setResults(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  const totalResults = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  const sections = [
    { key: 'announcements', title: 'Announcements', icon: <FileText size={18} />, link: '/announcements', color: '#3b82f6' },
    { key: 'guidelines', title: 'Guidelines', icon: <BookOpen size={18} />, link: '/guidelines', color: '#8b5cf6' },
    { key: 'activities', title: 'Activities', icon: <ClipboardList size={18} />, link: '/activities', color: '#16a34a' },
    { key: 'vendors', title: 'Vendors', icon: <Store size={18} />, link: '/vendors', color: '#ea580c' },
    { key: 'amenities', title: 'Amenities', icon: <Building size={18} />, link: '/amenities', color: '#0891b2' }
  ];

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Search Results</h1>
          <p className="page-subtitle">
            {query ? `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}"` : 'Enter a search query'}
          </p>
        </div>
      </div>

      {!query ? (
        <div className="empty-state"><Search size={64} /><h3>Start searching</h3><p>Use the search bar in the header to find content</p></div>
      ) : totalResults === 0 ? (
        <div className="empty-state"><Search size={64} /><h3>No results found</h3><p>Try different keywords or check the spelling</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sections.map(section => {
            const items = results[section.key];
            if (!items || items.length === 0) return null;
            return (
              <div key={section.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: section.color }}>
                    {section.icon} {section.title} ({items.length})
                  </h3>
                  <Link to={section.link} style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View all <ArrowRight size={14} />
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((item, i) => (
                    <Link
                      key={i}
                      to={section.link}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="card" style={{ padding: '0.8rem 1rem', cursor: 'pointer', transition: '0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = section.color}
                        onMouseLeave={e => e.currentTarget.style.borderColor = ''}
                      >
                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.title || item.name}</h4>
                        {(item.description || item.content) && (
                          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(item.description || item.content).substring(0, 150)}
                          </p>
                        )}
                        {item.category && <span className="badge" style={{ marginTop: '4px' }}>{item.category}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
