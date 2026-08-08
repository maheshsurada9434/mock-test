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
    // Fix questions accidentally joined to previous answer
    //
    // Example:
    // Answer: A) Delhi2. What is...
    //
    // becomes:
    // Answer: A) Delhi
    // 2. What is...
    // --------------------------------------------------------
    text = text.replace(
        /(?<!^)\s+(?=\d+\.\s+)/g,
        '\n'
    );
    // Also handle:
    // Delhi2. What is...
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
        // Answer: A) Something
        // Answer: A
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
                options[letter] = value;
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
        // QUESTION TEXT
        // Everything before first option
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
        // SAVE QUESTION
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
// This is SYNCHRONOUS.
//
// It returns a STRING.
//
// Generated format:
//
// #t=u%7B%22v%22%3A1...%7D
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
// IMPORTANT:
//
// This function is SYNCHRONOUS for the current "u" format.
//
// Therefore test.js can safely use:
//
// const test = decodeTest(token);
//
// No await is required.
//
// ============================================================
export function decodeTest(token) {
    if (!token) {
        return null;
    }
    try {
        token =
            String(token).trim();
        // ----------------------------------------------------
        // CURRENT FORMAT
        //
        // u%7B%22v%22%3A1...
        // ----------------------------------------------------
        if (
            token.charAt(0) === 'u'
        ) {
            const encoded =
                token.slice(1);
            if (!encoded) {
                return null;
            }
            const json =
                decodeURIComponent(
                    encoded
                );
            const data =
                JSON.parse(json);
            // ------------------------------------------------
            // Validate decoded test
            // ------------------------------------------------
            if (
                !data ||
                typeof data !== 'object'
            ) {
                throw new Error(
                    'Decoded test is not an object.'
                );
            }
            if (
                !Array.isArray(
                    data.questions
                )
            ) {
                throw new Error(
                    'Test contains no questions.'
                );
            }
            return data;
        }
        // ----------------------------------------------------
        // OLD COMPRESSED FORMAT
        //
        // NOTE:
        // This format requires asynchronous decompression.
        //
        // It is kept separately for compatibility.
        // ----------------------------------------------------
        if (
            token.charAt(0) === 'g'
        ) {
            console.warn(
                'Old compressed test link detected. ' +
                'Use decodeTestAsync() for old g-links.'
            );
            return null;
        }
        console.error(
            'Unknown test token format.'
        );
        return null;
    } catch (error) {
        console.error(
            'Test decoding error:',
            error
        );
        return null;
    }
}
// ============================================================
// ASYNC DECODE TEST
// ============================================================
//
// Used only for OLD compressed "g" links.
//
// New "u" links do NOT need this function.
//
// ============================================================
export async function decodeTestAsync(token) {
    if (!token) {
        return null;
    }
    token =
        String(token).trim();
    // --------------------------------------------------------
    // Current format
    // --------------------------------------------------------
    if (
        token.charAt(0) === 'u'
    ) {
        return decodeTest(token);
    }
    // --------------------------------------------------------
    // Old compressed format
    // --------------------------------------------------------
    if (
        token.charAt(0) === 'g'
    ) {
        try {
            if (
                typeof DecompressionStream ===
                'undefined'
            ) {
                throw new Error(
                    'This browser does not support compressed test links.'
                );
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
        } catch (error) {
            console.error(
                'Compressed test decoding error:',
                error
            );
            return null;
        }
    }
    return null;
}
// ============================================================
// BASE64 DECODER
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
// test.html?t=xxxxx
//
// ============================================================
export function tokenFromUrl() {
    // --------------------------------------------------------
    // HASH
    // --------------------------------------------------------
    const hash =
        location.hash || '';
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
            location.search
        );
    return params.get('t');
}
// ============================================================
// TIMER FORMAT
// ============================================================
//
// 0     -> 00:00
// 65    -> 01:05
// 125   -> 02:05
// 3600  -> 60:00
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
        Math.floor(
            sec / 60
        );
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
