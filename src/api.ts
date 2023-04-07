import axios, { AxiosResponse } from "axios";
import { TextDecoder } from "util";
import { AuthRateLimitError, NoAuthRateLimitError, RateLimitError } from "./errors";

const BASE_URL = 'http://aicursor.com/';
const CONVERSATION_ENDPOINT = `${BASE_URL}conversation`;

/* eslint-disable @typescript-eslint/naming-convention */
const headers = {
    'Content-Type': 'application/json',
    'Host': 'aicursor.com',
    'Connection': 'keep-alive',
    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108"',
    'sec-ch-ua-platform': 'Windows',
    'sec-ch-ua-mobile': '?0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/0.1.11 Chrome/108.0.5359.62 Electron/22.0.0 Safari/537.36',
    'Accept': '*/*',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'http://localhost:3000/',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US'
};
/* eslint-enable @typescript-eslint/naming-convention */

export async function* generate(prompt: string, filePath: string, fileContents: string, projectPath: string | null = null, selection: string | null = null) {
    const response = await axios.post(CONVERSATION_ENDPOINT,
        {
            'userRequest': {
                'message': prompt,
                'currentRootPath': projectPath,
                'currentFileName': filePath,
                'currentFileContents': fileContents,
                'precedingCode': [],
                'currentSelection': selection,
                'suffixCode': [],
                'copilotCodeBlocks': [],
                'customCodeBlocks': [],
                'codeBlockIdentifiers': [],
                'msgType': 'generate',
                'maxOrigLine': null,
                'diagnostics': null
            },
            'userMessages': [],
            'botMessages': [],
            'contextType': 'none',
            'rootPath': projectPath ?? ""
        }, { headers, responseType: 'stream' });

    // TODO: check for status code and throw appropiate exceptions
    if (response.status === 429) {
        throw new RateLimitError();
    }

    // yield* streamSource(response);

    let message = false;
    for await (let chunk of decodeStream(response)) {
        if (chunk === '<|END_message|>') {
            message = false;
        }
        if (message) {
            yield chunk as string;
        }
        if (chunk === '<|BEGIN_message|>') {
            message = true;
        }
    }
}

async function* decodeStream(response: AxiosResponse): AsyncGenerator<any> {
    if (response.status === 429) {
        // Check the error text
        if (response.statusText === 'NO_AUTH') {
            throw new NoAuthRateLimitError();
        } else {
            throw new AuthRateLimitError();
        }
    }

    // Check if the response is an event-stream
    if (
        response.headers['content-type'] ===
        'text/event-stream; charset=utf-8'
    ) {
        const stream = response.data;
        // Create a decoder to decode the stream as UTF-8 text
        const decoder = new TextDecoder('utf-8');
        for await (let chunk of stream) {
            const rawValue = decoder.decode(chunk);
            const lines = rawValue.split('\n');

            for (let line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonstring = line.slice(6);
                    if (jsonstring === '[DONE]') {
                        return;
                    }
                    yield JSON.parse(jsonstring);
                }
            }
        }
    } else {
        // Raise exception
        throw new Error('Response is not an event-stream');
    }
}