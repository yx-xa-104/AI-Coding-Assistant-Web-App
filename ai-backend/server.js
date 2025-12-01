import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Lấy API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Kiểm tra Key ngay khi khởi động
if (!GEMINI_API_KEY) {
    console.warn("⚠️ CẢNH BÁO: Chưa tìm thấy GEMINI_API_KEY trong file .env");
}

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send(`AI Backend (Gemini) đang chạy ổn định trên cổng ${port}`);
});

app.post('/generate', async (req, res) => {
    try {
        const { prompt, language, code, codeContext } = req.body;
        const finalCode = codeContext || code || "";

        if (!prompt) {
            return res.status(400).json({ error: 'Vui lòng nhập câu hỏi (prompt).' });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Server chưa cấu hình GEMINI_API_KEY. Hãy kiểm tra file .env' });
        }

        const fullPrompt = `Bạn là chuyên gia lập trình ${language || 'đa ngôn ngữ'}.
        Trả lời câu hỏi dựa trên code sau:
        --- CODE ---
        ${finalCode}
        --- HẾT CODE ---
        Câu hỏi: ${prompt}`;

        console.log(" Đang gọi Google Gemini API...");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }]
            })
        });

        const data = await response.json();

        // Xử lý lỗi từ Google
        if (!response.ok) {
            const errorMsg = data.error?.message || response.statusText;
            console.error("Lỗi từ Google:", errorMsg);
            throw new Error(`Google API Error: ${errorMsg}`);
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            throw new Error("Gemini không trả về nội dung nào.");
        }

        console.log("Đã nhận phản hồi thành công.");
        res.json({ reply });

    } catch (error) {
        console.error('Lỗi Server:', error.message);
        // Trả về lỗi chi tiết để hiển thị ở Frontend
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`
    Server đã sẵn sàng!
    URL: http://localhost:${port}
    Trạng thái Key: ${GEMINI_API_KEY ? 'Đã nạp' : 'Thiếu Key (Cần tạo file .env)'}
    `);
});