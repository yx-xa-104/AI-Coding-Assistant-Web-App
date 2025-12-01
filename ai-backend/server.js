import express from 'express';
import fetch from 'node-fetch'; 
import cors from 'cors';
import 'dotenv/config'; 

const app = express();
const port = process.env.PORT || 3000; 


app.use(cors());
app.use(express.json());

// --- Kiểm tra API Key ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.error('LỖI: Không tìm thấy OPENAI_API_KEY trong file .env');
    console.log('Hãy tạo file .env và thêm OPENAI_API_KEY=key_của_bạn');
    process.exit(1); 
}

app.get('/', (req, res) => {
    res.send('AI Assistant Backend đang chạy!');
});

// --- Xử lý yêu cầu tạo phản hồi từ AI ---
app.post('/generate', async (req, res) => {
    const { prompt, codeContext, language } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào
    if (!prompt || !codeContext || !language) {
        return res.status(400).json({ error: 'Thiếu các trường: prompt, codeContext, hoặc language' });
    }
    // 2. Tạo system prompt động
    const systemPrompt = `Bạn là một trợ lý lập trình chuyên gia về ${language}.
    Người dùng đã cung cấp đoạn code sau từ trình soạn thảo của họ:
    --- CODE HIỆN TẠI ---
    ${codeContext}
    --- HẾT CODE ---
    
    Câu hỏi của người dùng là: "${prompt}"
    
    Hãy đưa ra câu trả lời hữu ích, súc tích và chính xác.
    - Nếu giải thích, hãy rõ ràng.
    - Nếu tìm lỗi, hãy chỉ ra chúng.
    - Nếu tối ưu, hãy đề xuất thay đổi.
    - Luôn sử dụng markdown (ví dụ: \`code\`) cho các đoạn code snippet.`;

    try {
        // 3. Gọi đến API của OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt 
                    }
                ],
                max_tokens: 1500, // Giới hạn độ dài phản hồi
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Lỗi từ OpenAI API:', errorBody);
            throw new Error(`OpenAI API request thất bại: ${response.statusText}`);
        }

        const data = await response.json();
        
        // 4. Trích xuất và gửi phản hồi về cho frontend
        const reply = data.choices[0]?.message?.content;
        
        if (reply) {
            res.json({ reply: reply }); 
        } else {
            res.status(500).json({ error: 'Không nhận được phản hồi hợp lệ từ AI.' });
        }

    } catch (error) {
        console.error('Lỗi nghiêm trọng tại /generate:', error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
    }
});

// --- Khởi động máy chủ ---
app.listen(port, () => {
    console.log(`Backend server đang lắng nghe tại http://localhost:${port}`);
});