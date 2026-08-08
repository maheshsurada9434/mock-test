// ============================================================
// COMMON.JS
// Text to Mock Test
// ============================================================
// ------------------------------------------------------------
// Escape HTML
// ------------------------------------------------------------
export function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}
// ------------------------------------------------------------
// Parse MCQs
// Supports:
//
// 1. Question
// A) Option
// B) Option
// C) Option
// D) Option
// Answer: A) Option
//
// Also supports compact format:
//
// Answer: A) Option1. Next Question...
// Answer: B) Option2. Next Question...
// ------------------------------------------------------------
export function parseMCQs(text) {
    if (!text) {
        return [];
    }
    // Normalize text
    text = text
        .replace(/\r/g, '')
        .replace(/\u00a0/g, ' ')
        .trim();
    if (!text) {
        return [];
    }
    // --------------------------------------------------------
    // Put a newline before question numbers.
    //
    // Example:
    //
    // Answer: A) Mirabai Chanu2. Mirabai...
    //
    // becomes:
    //
    // Answer: A) Mirabai Chanu
    // 2. Mirabai...
    // --------------------------------------------------------
    text = text.replace(
        /(?<!^)\s+(?=\d+\.\s+)/g,
        '\n'
    );
    // --------------------------------------------------------
    // Find question numbers
    // --------------------------------------------------------
    const questionRegex =
        /(?:^|\n)\s*(\d+)\.\s+/g;
    const starts = [];
    let match;
    while ((match = questionRegex.exec(text)) !== null) {
        starts.push({
            number: Number(match[1]),
            start: match.index + match[0].length,
            index: match.index
        });
    }
    if (!starts.length) {
        return [];
    }
    const output = [];
    // --------------------------------------------------------
    // Process every question
    // --------------------------------------------------------
    for (let i = 0; i < starts.length; i++) {
        const start = starts[i].start;
        const end =
            i + 1 < starts.length
                ? starts[i + 1].index
                : text.length;
        let block =
            text.slice(start, end).trim();
        if (!block) {
            continue;
        }
        // ----------------------------------------------------
        // Find Answer
        // Example:
        //
        // Answer: A) Mirabai Chanu
        // ----------------------------------------------------
        const answerMatch = block.match(
            /\bAnswer\s*:\s*([A-D])\)\s*(.*?)\s*$/is
        );
        let answer = null;
        if (answerMatch) {
            answer =
                answerMatch[1].toUpperCase();
            // Remove answer from question block
            block =
                block
                    .slice(0, answerMatch.index)
                    .trim();
        }
        // ----------------------------------------------------
        // Find options A), B), C), D)
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
            options[letter] = value;
        }
        // Need at least 2 options
        if (
            Object.keys(options).length < 2
        ) {
            continue;
        }
        // ----------------------------------------------------
        // Question text is before first option
        // ----------------------------------------------------
        const firstOption =
            block.search(
                /(?:^|\s)[A-D]\)\s+/i
            );
        let question = '';
        if (firstOption >= 0) {
            question =
                block
                    .slice(0, firstOption)
                    .trim();
        } else {
            question =
                block.trim();
        }
        if (!question) {
            continue;
        }
        // ----------------------------------------------------
        // Add question
        // ----------------------------------------------------
        output.push({
            id: starts[i].number,
            question: question,
            options: options,
            answer: answer
        });
    }
    return output;
}
// ============================================================
// SHAREABLE TEST ENCODING
// ============================================================
//
// This version intentionally does NOT use CompressionStream.
// It avoids delays/freezing on some iPhones and browsers.
//
// The complete test is stored in the URL.
// No Firebase.
// No server.
// No database.
// ============================================================
export async function encodeTest(obj) {
    const json =
        JSON.stringify(obj);
    return 'u' +
        encodeURIComponent(json);
}
// ------------------------------------------------------------
// Decode Test
// ------------------------------------------------------------
export async function decodeTest(token) {
    if (!token) {
        return null;
    }
    try {
        // Uncompressed URL data
        if (token[0] === 'u') {
            return JSON.parse(
                decodeURIComponent(
                    token.slice(1)
                )
            );
        }
        // ----------------------------------------------------
        // Compatibility with previously generated
        // compressed links.
        // ----------------------------------------------------
        if (
            token[0] === 'g' &&
            'DecompressionStream' in window
        ) {
            const bytes =
                b64ToBytes(
                    token.slice(1)
                );
            const ds =
                new DecompressionStream(
                    'gzip'
                );
            const writer =
                ds.writable.getWriter();
            await writer.write(bytes);
            await writer.close();
            const buffer =
                await new Response(
                    ds.readable
                ).arrayBuffer();
            return JSON.parse(
                new TextDecoder()
                    .decode(buffer)
            );
        }
    } catch (error) {
        console.error(
            'Test decoding error:',
            error
        );
    }
    return null;
}
// ============================================================
// BASE64 HELPERS
// Used only for old compressed links.
// ============================================================
function b64ToBytes(str) {
    str =
        str
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
// GET TEST TOKEN FROM URL
// ============================================================
export function tokenFromUrl() {
    // Hash format:
    //
    // test.html#t=xxxxx
    if (
        location.hash &&
        location.hash.startsWith('#t=')
    ) {
        return location.hash.slice(3);
    }
    // Query-string fallback:
    //
    // test.html?t=xxxxx
    return new URLSearchParams(
        location.search
    ).get('t');
}
// ============================================================
// TIMER FORMAT
// ============================================================
//
// 125 seconds → 02:05
// ============================================================
export function fmt(sec) {
    sec =
        Math.max(
            0,
            Math.floor(sec)
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
