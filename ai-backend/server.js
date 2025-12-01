import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3001; 

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send(`AI Backend (Gemini) đang chạy trên cổng ${port}`);
});

app.post('/generate', async (req, res) => {
    console.log('--- Nhận Request (Gemini) ---');
    
    const { prompt, language, code, codeContext } = req.body;
    const finalCode = codeContext || code || "";

    if (!prompt || !finalCode) {
        console.error('Lỗi: Thiếu prompt hoặc code');
        return res.status(400).json({ error: 'Thiếu prompt hoặc code context' });
    }

    // 1. Cấu trúc Prompt cho Gemini
    const fullPrompt = `Bạn là chuyên gia lập trình ${language || 'đa ngôn ngữ'}.
    Hãy trả lời câu hỏi sau đây dựa trên đoạn code được cung cấp.
    
    --- CODE CONTEXT ---
    ${finalCode}
    --- END CODE ---

    CÂU HỎI CỦA NGƯỜI DÙNG: ${prompt}`;

    try {
        if (!GEMINI_API_KEY) throw new Error("Chưa cấu hình GEMINI_API_KEY trong file .env");

        // 2. Gọi Google Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: fullPrompt }]
                }]
            })
        });

        const data = await response.json();
        
        // Xử lý lỗi từ Google trả về
        if (data.error) {
            throw new Error(data.error.message);
        }

        // 3. Phân tích kết quả từ JSON của Gemini
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini không phản hồi.";
        
        res.json({ reply });

    } catch (error) {
        console.error('Gemini Error:', error.message);
        res.status(500).json({ error: `Lỗi Gemini: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`✅ Server (Gemini) đang chạy tại: http://localhost:${port}`);
});