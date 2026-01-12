const express = require('express');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ========================
// HEALTH CHECK
// ========================
app.get('/', (req, res) => {
  res.send('Server running');
});

// ========================
// REMOVE.BG (SAFE + OPTIONAL)
// ========================
app.post('/remove-bg', async (req, res) => {
  try {
    const base64 = req.body.image;
    if (!base64) return res.json({ image: null });

    const buffer = Buffer.from(
      base64.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );

    const formData = new FormData();
    formData.append('image_file', buffer, 'image.png');
    formData.append('size', 'auto');

    const response = await fetch(
      'https://api.remove.bg/v1.0/removebg',
      {
        method: 'POST',
        headers: {
          'X-Api-Key': 'fW3RanUVg5QqMK3ZmRyvX4Yv'
        },
        body: formData
      }
    );

    if (!response.ok) {
      // 🔁 fallback → keep original image
      return res.json({ image: base64 });
    }

    const cleaned = await response.arrayBuffer();

    res.json({
      image:
        'data:image/png;base64,' +
        Buffer.from(cleaned).toString('base64')
    });

  } catch (e) {
    // 🔁 fallback → keep original image
    res.json({ image: req.body.image });
  }
});

// ========================
// PRINTFUL FILE UPLOAD (CORRECT)
// ========================
app.post('/printful/upload', async (req, res) => {
  try {
    const base64 = req.body.image;
    if (!base64) return res.status(400).json({ error: 'No image' });

    const buffer = Buffer.from(
      base64.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );

    const formData = new FormData();
    formData.append('files[]', buffer, 'print.png');

    const response = await fetch(
      'https://api.printful.com/files',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer pr1sXrD7zNeCqc5OKcL6agpydqyWzjeHsIHzZygm'
        },
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(500).json({ error: 'Printful upload failed' });
    }

    res.json({
      fileId: data.result[0].id,
      fileUrl: data.result[0].url
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
