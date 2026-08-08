// ============================================================
// COMMON.JS
// Text to Mock Test
// ============================================================
// ============================================================
// ESCAPE HTML
// ============================================================
export function esc(s) {
    return String(s ?? '').replace(
        /[&<>"']/g,
        m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m])
    );
}
// ============================================================
// PARSE MCQs
// ============================================================
//
// Supports:
//
// 1. Question
// A) Option A
// B) Option B
// C) Option C
// D) Option D
// Answer: A) Option A
//
// Also supports text where questions are directly joined:
//
// Answer: A) Option 1. Next Question
//
// ============================================================
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
    // PROCESS EACH QUESTION
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
        // Find Answer
        // ----------------------------------------------------
        const answerMatch =
            block.match(
                /\bAnswer\s*:\s*([A-D])\)\s*(.*?)\s*$/is
            );
        let answer = null;
        if (answerMatch) {
            answer =
                answerMatch[1].toUpperCase();
            // Remove Answer section
            block =
                block
                    .slice(
                        0,
                        answerMatch.index
                    )
                    .trim();
        }
        // ----------------------------------------------------
        // Find A), B), C), D)
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
            options[letter] =
                value;
        }
        // At least 2 options required
        if (
            Object.keys(options).length < 2
        ) {
            continue;
        }
        // ----------------------------------------------------
        // Find question text
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
        // Save question
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
// ENCODE TEST
// ============================================================
//
// IMPORTANT:
// This is intentionally synchronous.
// No CompressionStream.
// No await.
// No delay.
//
// This matches create.js:
//
// const token = encodeTest(data);
//
// ============================================================
export function encodeTest(obj) {
    const json =
        JSON.stringify(obj);
    return (
        'u' +
        encodeURIComponent(json)
    );
}
// ============================================================
// DECODE TEST
// ============================================================
export async function decodeTest(token) {
    if (!token) {
        return null;
    }
    try {
        // ----------------------------------------------------
        // Normal uncompressed test
        // ----------------------------------------------------
        if (
            token[0] === 'u'
        ) {
            return JSON.parse(
                decodeURIComponent(
                    token.slice(1)
                )
            );
        }
        // ----------------------------------------------------
        // Compatibility with old compressed links
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
// BASE64 DECODER
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
    // --------------------------------------------------------
    // Hash format
    //
    // test.html#t=xxxxx
    // --------------------------------------------------------
    if (
        location.hash &&
        location.hash.startsWith('#t=')
    ) {
        return location.hash.slice(3);
    }
    // --------------------------------------------------------
    // Query-string format
    //
    // test.html?t=xxxxx
    // --------------------------------------------------------
    return new URLSearchParams(
        location.search
    ).get('t');
}
// ============================================================
// TIMER FORMAT
// ============================================================
//
// Example:
//
// 125 seconds → 02:05
//
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
