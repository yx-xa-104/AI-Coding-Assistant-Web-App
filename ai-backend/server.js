import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Thư viện Google
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Khởi tạo Google AI Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => res.send('AI Backend (Streaming Mode) is Ready!'));

app.post('/generate', async (req, res) => {
    const { prompt, codeContext, language } = req.body;
    const finalCode = codeContext || "";

    if (!prompt) return res.status(400).json({ error: 'Thiếu prompt' });

    // Thiết lập Header
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        // Chọn Model Gemini-pro
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const fullPrompt = `Bạn là chuyên gia lập trình ${language || 'đa ngôn ngữ'}.
        Code context:
        ${finalCode}
        
        Yêu cầu: ${prompt}`;

        // Gọi hàm stream
        const result = await model.generateContentStream(fullPrompt);

        // Vòng lặp đọc từng mảnh dữ liệu
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(chunkText);
        }

        res.end();

    } catch (error) {
        console.error("Lỗi Stream:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            res.write("\n[Lỗi kết nối với AI]");
            res.end();
        }
    }
});

app.listen(port, () => {
    console.log(` Server Streaming đang chạy tại http://localhost:${port}`);
});