require('dotenv').config();
const express = require('express');
const cors = require('cors');
const CryptoJS = require('crypto-js');
const request = require('request');

const app = express();
app.use(cors());
app.use(express.json());

const config = {
    appid: process.env.APP_ID,
    apiSecret: process.env.API_SECRET,
    apiKey: process.env.API_KEY,
    hostUrl: "https://ntrans.xfyun.cn/v2/ots",
    host: "ntrans.xfyun.cn",
    uri: "/v2/ots"
};

app.post('/translate', (req, res) => {
    const { text, from, to } = req.body;
    
    // 参数验证
    if (!text || !from || !to) {
        return res.status(400).json({ error: '缺少必要参数' });
    }
    if (text.length > 16383) {
        return res.status(400).json({ error: '文本长度超过限制' });
    }

    const date = new Date().toUTCString();
    const postBody = getPostBody(text, from, to);
    const digest = getDigest(postBody);

    const options = {
        url: config.hostUrl,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json,version=1.0',
            'Host': config.host,
            'Date': date,
            'Digest': digest,
            'Authorization': getAuthStr(date, digest)
        },
        json: true,
        body: postBody
    };

    request.post(options, (err, response, body) => {
        if (err || response.statusCode !== 200) {
            console.error('API Error:', err || body);
            return res.status(500).json({ 
                error: err ? err.message : (body.message || '翻译服务不可用')
            });
        }

        if (body.code !== 0) {
            return res.status(400).json({
                error: `[${body.code}] ${body.message}`
            });
        }

        res.json({
            translation: body.data.result.trans_result.dst,
            from: body.data.result.from,
            to: body.data.result.to
        });
    });
});

// 以下工具函数与文档3保持一致
function getPostBody(text, from, to) {
    return {
        common: { app_id: config.appid },
        business: { from, to },
        data: { 
            text: CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text))
        }
    };
}

function getDigest(body) {
    return 'SHA-256=' + CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(JSON.stringify(body)));
}

function getAuthStr(date, digest) {
    const signatureOrigin = `host: ${config.host}\ndate: ${date}\nPOST ${config.uri} HTTP/1.1\ndigest: ${digest}`;
    const signature = CryptoJS.enc.Base64.stringify(
        CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret)
    );
    return `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${signature}"`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});