import { Link } from 'react-router-dom';
import { glossaryMap } from '../data/glossaryTerms';

export const GlossaryTip = ({ term }: { term: string }) => {
  const entry = glossaryMap[term];

  if (!entry) {
    return <span>{term}</span>;
  }

  const anchorId = term.toLowerCase().replace(/\s+/g, '-');

  return (
    <Link
      to={`/glossary#${anchorId}`}
      title={entry.definition}
      style={{
        textDecoration: 'none',
        borderBottom: '1px dotted rgba(79, 70, 229, 0.5)',
        color: 'inherit',
        transition: 'all 0.2s ease',
        cursor: 'help'
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = 'rgba(79, 70, 229, 1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = 'rgba(79, 70, 229, 0.5)';
      }}
    >
      {term}
    </Link>
  );
};
