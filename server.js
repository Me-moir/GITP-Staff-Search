const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes

const sheetId = process.env.SHEET_ID;
const apiKey = process.env.API_KEY;

app.get('/api/sheets', async (req, res) => {
    try {
        // Fetch Google Sheets info
        const response = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`, {
            params: { key: apiKey }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching sheets:', error);
        res.status(500).json({ error: 'Failed to fetch sheets' });
    }
});

app.get('/api/sheet/:sheetName', async (req, res) => {
    const sheetName = req.params.sheetName;
    try {
        // Fetch specific sheet data
        const response = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}`, {
            params: { key: apiKey }
        });
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching sheet ${sheetName}:`, error);
        res.status(500).json({ error: `Failed to fetch sheet ${sheetName}` });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
