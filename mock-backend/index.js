const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/api/calls', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/capabilities', (req, res) => {
  res.json({ success: true, data: ['calls:create', 'calls:list'] });
});

app.get('/api/voice/calls', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/', (req, res) => res.send('mock-backend running'));

app.listen(PORT, () => console.log(`mock-backend listening on ${PORT}`));
