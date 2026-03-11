import { Share2, Copy, MessageCircle, ExternalLink } from 'lucide-react';

interface ShareCardProps {
  fromSymbol: string;
  toSymbol: string;
  title: string;
  description?: string;
  url: string;
}

export function ShareCard({ fromSymbol, toSymbol, title, description: _desc, url }: ShareCardProps) {
  const shareText = `Check out this linguistic shift: ${fromSymbol} → ${toSymbol}\n\n${title}\n\n${url}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${fromSymbol}→${toSymbol} shift: ${title} ${url}`)}`;
  const copiedMessage = '✓ Copied to clipboard!';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('copy-btn');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = copiedMessage;
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    });
  };

  return (
    <div style={{
      background: 'var(--surface-color)',
      padding: '1rem',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      marginTop: '1.5rem'
    }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Share2 size={14} /> Share This Shift
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on WhatsApp"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.75rem',
            background: '#25d366',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: 500,
            transition: 'opacity 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <MessageCircle size={14} /> WhatsApp
        </a>

        {/* Twitter/X */}
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on Twitter"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.75rem',
            background: '#1da1f2',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: 500,
            transition: 'opacity 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          𝕏 Twitter
        </a>

        {/* Copy Link */}
        <button
          id="copy-btn"
          onClick={handleCopyLink}
          title="Copy link to clipboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--surface-hover)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-color)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = 'var(--accent-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <Copy size={14} /> Copy Link
        </button>

        {/* Direct Link */}
        <a
          href={url}
          title="Open shift in new tab"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--surface-hover)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--accent-color)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-color)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)';
            e.currentTarget.style.color = 'var(--accent-color)';
          }}
        >
          <ExternalLink size={14} /> Open
        </a>
      </div>

      {/* URL Preview */}
      <div style={{
        marginTop: '0.75rem',
        padding: '0.5rem',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '4px',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
        wordBreak: 'break-all',
        fontFamily: 'monospace'
      }}>
        {url}
      </div>
    </div>
  );
}
