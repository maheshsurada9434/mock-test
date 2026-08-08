// ============================================================
// COMMON.JS
// Text to Mock Test
// GitHub Pages
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
// Supported format:
//
// 1. What is 2 + 2?
// A) 2
// B) 3
// C) 4
// D) 5
// Answer: C) 4
//
// Also supports questions where question numbers are
// accidentally joined to the previous answer.
//
// ============================================================
export function parseMCQs(text) {
    if (!text) {
        return [];
    }
    // --------------------------------------------------------
    // Normalize text
    // --------------------------------------------------------
    text = String(text)
        .replace(/\r/g, '')
        .replace(/\u00a0/g, ' ')
        .trim();
    if (!text) {
        return [];
    }
    // --------------------------------------------------------
    // Add newline before question numbers.
    //
    // Example:
    //
    // Answer: A) Delhi2. What is...
    //
    // becomes:
    //
    // Answer: A) Delhi
    // 2. What is...
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
        // Find answer
        //
        // Answer: A) Something
        // ----------------------------------------------------
        const answerMatch =
            block.match(
                /\bAnswer\s*:\s*([A-D])\s*\)/i
            );
        let answer = null;
        if (answerMatch) {
            answer =
                answerMatch[1].toUpperCase();
            // Remove everything from Answer:
            // onward.
            block =
                block
                    .slice(
                        0,
                        answerMatch.index
                    )
                    .trim();
        }
        // ----------------------------------------------------
        // Find options
        //
        // A) ...
        // B) ...
        // C) ...
        // D) ...
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
                options[letter] =
                    value;
            }
        }
        // ----------------------------------------------------
        // Require at least 2 options
        // ----------------------------------------------------
        if (
            Object.keys(options).length < 2
        ) {
            continue;
        }
        // ----------------------------------------------------
        // Find question text.
        //
        // Everything before A) is the question.
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
//
// This function is SYNCHRONOUS.
//
// Do NOT add "async" here.
//
// create.js uses:
//
// const token = encodeTest(data);
//
// ============================================================
export function encodeTest(obj) {
    try {
        const json =
            JSON.stringify(obj);
        if (!json) {
            throw new Error(
                'Unable to convert test data.'
            );
        }
        return (
            'u' +
            encodeURIComponent(json)
        );
    } catch (error) {
        console.error(
            'Encoding error:',
            error
        );
        throw error;
    }
}
// ============================================================
// DECODE TEST
// ============================================================
//
// Supports the current "u" links.
//
// Also supports old "g" compressed links.
//
// ============================================================
export async function decodeTest(token) {
    if (!token) {
        return null;
    }
    try {
        // ----------------------------------------------------
        // Current uncompressed format
        // ----------------------------------------------------
        if (
            token.charAt(0) === 'u'
        ) {
            const json =
                decodeURIComponent(
                    token.slice(1)
                );
            return JSON.parse(json);
        }
        // ----------------------------------------------------
        // Old compressed format
        // ----------------------------------------------------
        if (
            token.charAt(0) === 'g'
        ) {
            if (
                typeof DecompressionStream ===
                'undefined'
            ) {
                console.error(
                    'This browser does not support compressed test links.'
                );
                return null;
            }
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
            const json =
                new TextDecoder()
                    .decode(buffer);
            return JSON.parse(json);
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
// ============================================================
//
// Used only for old compressed links.
// ============================================================
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
// GET TEST TOKEN FROM URL
// ============================================================
//
// Supported:
//
// test.html#t=xxxxx
//
// and:
//
// test.html?t=xxxxx
//
// ============================================================
export function tokenFromUrl() {
    // --------------------------------------------------------
    // Hash format
    // --------------------------------------------------------
    if (
        location.hash &&
        location.hash.startsWith('#t=')
    ) {
        return location.hash.slice(3);
    }
    // --------------------------------------------------------
    // Query-string format
    // --------------------------------------------------------
    const params =
        new URLSearchParams(
            location.search
        );
    return params.get('t');
}
// ============================================================
// TIMER FORMAT
// ============================================================
//
// 0     → 00:00
// 65    → 01:05
// 125   → 02:05
// 3600  → 60:00
//
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
