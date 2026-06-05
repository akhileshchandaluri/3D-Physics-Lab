import { useState } from 'react';
import { Box, TextField, Button, Alert, Snackbar } from '@mui/material';

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
    } catch {
      console.error('Failed to submit feedback');
    }
  };

  return (
    <Box sx={{ p: 2.5 }}>
      <TextField
        fullWidth
        multiline
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        variant="outlined"
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!text.trim()}
          size="medium"
        >
          {buttonText}
        </Button>
      </Box>
      <Snackbar 
        open={submitted} 
        autoHideDuration={3000} 
        onClose={() => setSubmitted(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          Feedback submitted successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}

