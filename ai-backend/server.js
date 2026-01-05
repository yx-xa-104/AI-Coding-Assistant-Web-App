import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => res.send('AI Backend (Streaming Mode) is Ready!'));

app.post('/generate', async (req, res) => {
    const { prompt, codeContext, language } = req.body;
    const finalCode = codeContext || "";

    if (!prompt) return res.status(400).json({ error: 'Thiếu prompt' });


    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        console.log("Using model: gemini-2.0-flash-exp");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const fullPrompt = `Bạn là chuyên gia lập trình ${language || 'đa ngôn ngữ'}.
        Code context:
        ${finalCode}
        
        Yêu cầu: ${prompt}`;

        const result = await model.generateContentStream(fullPrompt);

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