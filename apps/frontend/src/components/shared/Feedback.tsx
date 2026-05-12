import { useState } from 'react';

interface FeedbackProps {
  placeholder?: string;
  buttonText?: string;
}

export function Feedback({ placeholder = 'Share your feedback...', buttonText = 'Submit' }: FeedbackProps) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experiment_slug: 'ohms-law', message: text }),
      });
      setSubmitted(true);
      setText('');
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      console.error('Failed to submit feedback');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '0.5px solid #e0e0e0',
          background: '#f9f9f9',
          fontSize: '14px',
          color: '#111',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
          marginBottom: '10px',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          style={{
            padding: '8px 20px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            background: text.trim() ? '#4f46e5' : '#e5e7eb',
            color: text.trim() ? '#fff' : '#9ca3af',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          {buttonText}
        </button>
        {submitted && (
          <span style={{ fontSize: '13px', color: '#166534' }}>
            Feedback submitted!
          </span>
        )}
      </div>
    </div>
  );
}
