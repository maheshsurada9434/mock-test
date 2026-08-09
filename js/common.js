// ============================================================
// COMMON.JS
// Text to Mock Test
// GitHub Pages
// No Firebase
// No Server
// ============================================================
// ============================================================
// ESCAPE HTML
// ============================================================
export function esc(s) {
    return String(s ?? '').replace(
        /[&<>"']/g,
        function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[m];
        }
    );
}
// ============================================================
// PARSE MCQs
// ============================================================
export function parseMCQs(text) {
    if (!text) {
        return [];
    }
    text = String(text)
        .replace(/\r/g, '')
        .replace(/\u00a0/g, ' ')
        .trim();
    if (!text) {
        return [];
    }
    // --------------------------------------------------------
    // Fix joined questions
    // Example:
    // Delhi2. What is...
    // --------------------------------------------------------
    text = text.replace(
        /(?<!^)\s+(?=\d+\.\s+)/g,
        '\n'
    );
    text = text.replace(
        /([^\d\s])(\d+)\.\s+/g,
        '$1\n$2. '
    );
    // --------------------------------------------------------
    // Find question numbers
    // --------------------------------------------------------
    const questionRegex =
        /(?:^|\n)\s*(\d+)\.\s+/g;
    const starts = [];
    let match;
    while (
        (match = questionRegex.exec(text)) !== null
    ) {
        starts.push({
            number: Number(match[1]),
            start:
                match.index +
                match[0].length,
            index:
                match.index
        });
    }
    if (!starts.length) {
        return [];
    }
    const output = [];
    // ========================================================
    // PROCESS QUESTIONS
    // ========================================================
    for (
        let i = 0;
        i < starts.length;
        i++
    ) {
        const start =
            starts[i].start;
        const end =
            i + 1 < starts.length
                ? starts[i + 1].index
                : text.length;
        let block =
            text
                .slice(start, end)
                .trim();
        if (!block) {
            continue;
        }
        // ----------------------------------------------------
        // FIND ANSWER
        //
        // Supports:
        // Answer: A
        // Answer: A)
        // Answer: A) Delhi
        // Correct Answer: A
        // ----------------------------------------------------
        let answer = null;
        const answerMatch =
            block.match(
                /(?:Answer|Correct\s*Answer)\s*:\s*([A-D])(?:\s*\)|\s|$)/i
            );
        if (answerMatch) {
            answer =
                answerMatch[1].toUpperCase();
            block =
                block
                    .slice(
                        0,
                        answerMatch.index
                    )
                    .trim();
        }
        // ----------------------------------------------------
        // FIND OPTIONS
        // ----------------------------------------------------
        const optionRegex =
            /(?:^|\s)([A-D])\)\s*(.*?)(?=\s+[A-D]\)\s+|$)/gs;
        const options = {};
        let optionMatch;
        while (
            (optionMatch =
                optionRegex.exec(block)) !== null
        ) {
            const letter =
                optionMatch[1].toUpperCase();
            const value =
                optionMatch[2].trim();
            if (value) {
                options[letter] = value;
            }
        }
        // ----------------------------------------------------
        // Need at least two options
        // ----------------------------------------------------
        if (
            Object.keys(options).length < 2
        ) {
            continue;
        }
        // ----------------------------------------------------
        // FIND QUESTION TEXT
        // ----------------------------------------------------
        const firstOption =
            block.search(
                /(?:^|\s)[A-D]\)\s+/i
            );
        let question = '';
        if (firstOption >= 0) {
            question =
                block
                    .slice(
                        0,
                        firstOption
                    )
                    .trim();
        } else {
            question =
                block.trim();
        }
        if (!question) {
            continue;
        }
        // ----------------------------------------------------
        // SAVE
        // ----------------------------------------------------
        output.push({
            id:
                starts[i].number,
            question:
                question,
            options:
                options,
            answer:
                answer
        });
    }
    return output;
}
// ============================================================
// COMPACT QUESTION FORMAT
// ============================================================
//
// Storing questions as [id, question, options, answer] tuples
// instead of {id, question, options, answer} objects removes
// four repeated key names per question, which is the single
// biggest contributor to URL length on large tests.
//
// ============================================================
function toCompactQuestions(questions) {
    return questions.map(function (q) {
        return [q.id, q.question, q.options, q.answer ?? null];
    });
}
function fromCompactQuestions(rows) {
    return rows.map(function (row) {
        return {
            id: row[0],
            question: row[1],
            options: row[2] || {},
            answer: row[3] ?? null
        };
    });
}
// ============================================================
// NORMALIZE DECODED TEST DATA
// ============================================================
//
// Accepts either the current compact format:
// { v:2, t, m, q:[[id,question,options,answer], ...] }
//
// or the legacy verbose format (old shared links must keep
// working):
// { v:1, title, minutes, questions:[{id,question,options,answer}] }
//
// and returns a single shape: { title, minutes, questions }
// ============================================================
function normalizeTestData(data) {
    if (!data || typeof data !== 'object') {
        return null;
    }
    let questions;
    let title;
    let minutes;
    if (Array.isArray(data.q)) {
        questions = fromCompactQuestions(data.q);
        title = data.t;
        minutes = data.m;
    } else if (Array.isArray(data.questions)) {
        questions = data.questions;
        title = data.title;
        minutes = data.minutes;
    } else {
        return null;
    }
    if (questions.length === 0) {
        return null;
    }
    return {
        title: title,
        minutes: minutes,
        questions: questions
    };
}
// ============================================================
// BASE64URL HELPERS (used by gzip token format)
// ============================================================
function bytesToB64Url(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
function b64ToBytes(str) {
    str =
        String(str)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
    while (
        str.length % 4
    ) {
        str += '=';
    }
    const binary =
        atob(str);
    const bytes =
        new Uint8Array(
            binary.length
        );
    for (
        let i = 0;
        i < binary.length;
        i++
    ) {
        bytes[i] =
            binary.charCodeAt(i);
    }
    return bytes;
}
// ============================================================
// GZIP COMPRESS (returns null if unsupported)
// ============================================================
async function gzipToken(json) {
    if (typeof CompressionStream === 'undefined') {
        return null;
    }
    try {
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(new TextEncoder().encode(json));
        writer.close();
        const buffer = await new Response(cs.readable).arrayBuffer();
        return 'g' + bytesToB64Url(new Uint8Array(buffer));
    } catch (error) {
        console.error('Compression error:', error);
        return null;
    }
}
// ============================================================
// ENCODE TEST
// ============================================================
//
// Produces the shortest available token:
// 'u' + encodeURIComponent(JSON)         — always works
// 'g' + base64url(gzip(JSON))            — used when shorter
//
// Question data is stored in the compact array format (v:2).
// ============================================================
export async function encodeTest(obj) {
    const compact = {
        v: 2,
        t: obj.title,
        m: obj.minutes,
        q: toCompactQuestions(obj.questions)
    };
    let json;
    try {
        json = JSON.stringify(compact);
    } catch (error) {
        console.error('Encoding error:', error);
        throw error;
    }
    if (!json) {
        throw new Error('Unable to convert test data.');
    }
    const plain = 'u' + encodeURIComponent(json);
    const gzipped = await gzipToken(json);
    // ------------------------------------------------------------
    // Pick whichever token is actually shorter. Gzip has fixed
    // header/footer overhead plus base64 expansion, so on very
    // short tests plain encoding can win; on larger tests gzip
    // typically cuts the link length by 60-70%.
    // ------------------------------------------------------------
    if (gzipped && gzipped.length < plain.length) {
        return gzipped;
    }
    return plain;
}
// ============================================================
// DECODE TEST (sync — 'u' format only)
// ============================================================
export function decodeTest(token) {
    if (!token) {
        return null;
    }
    try {
        token = String(token).trim();
        if (token.charAt(0) !== 'u') {
            return null;
        }
        let encoded = token.slice(1);
        if (!encoded) {
            return null;
        }
        let json = decodeURIComponent(encoded);
        // Handle accidental double encoding
        if (json.charAt(0) !== '{' && json.charAt(0) !== '[') {
            try {
                json = decodeURIComponent(json);
            } catch (e) {
                // Keep original decoded value
            }
        }
        const data = JSON.parse(json);
        const normalized = normalizeTestData(data);
        if (!normalized) {
            throw new Error('Test contains no questions.');
        }
        return normalized;
    } catch (error) {
        console.error('Test decoding error:', error);
        return null;
    }
}
// ============================================================
// ASYNC DECODE TEST
// ============================================================
//
// Supports both:
// u = plain (current or legacy questions[])
// g = gzip compressed (current compact format)
//
// ============================================================
export async function decodeTestAsync(token) {
    if (!token) {
        return null;
    }
    token = String(token).trim();
    if (token.charAt(0) === 'u') {
        return decodeTest(token);
    }
    if (token.charAt(0) === 'g') {
        try {
            if (typeof DecompressionStream === 'undefined') {
                throw new Error(
                    'This browser does not support compressed test links.'
                );
            }
            const bytes = b64ToBytes(token.slice(1));
            const ds = new DecompressionStream('gzip');
            const writer = ds.writable.getWriter();
            writer.write(bytes);
            writer.close();
            const buffer = await new Response(ds.readable).arrayBuffer();
            const json = new TextDecoder().decode(buffer);
            const data = JSON.parse(json);
            return normalizeTestData(data);
        } catch (error) {
            console.error('Compressed test decoding error:', error);
            return null;
        }
    }
    return null;
}
// ============================================================
// GET TEST TOKEN FROM URL
// ============================================================
//
// Supports:
//
// test.html#t=xxxxx
//
// test.html?t=xxxxx
//
// ============================================================
export function tokenFromUrl() {
    // --------------------------------------------------------
    // HASH
    // --------------------------------------------------------
    const hash =
        window.location.hash || '';
    if (
        hash.startsWith('#t=')
    ) {
        return hash.slice(3);
    }
    // --------------------------------------------------------
    // QUERY STRING
    // --------------------------------------------------------
    const params =
        new URLSearchParams(
            window.location.search
        );
    return params.get('t');
}
// ============================================================
// TIMER FORMAT
// ============================================================
export function fmt(sec) {
    sec =
        Math.max(
            0,
            Math.floor(
                Number(sec) || 0
            )
        );
    const minutes =
        Math.floor(sec / 60);
    const seconds =
        sec % 60;
    return (
        String(minutes)
            .padStart(2, '0')
        +
        ':'
        +
        String(seconds)
            .padStart(2, '0')
    );
}
