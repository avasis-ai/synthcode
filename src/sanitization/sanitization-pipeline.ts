import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ISanitizer {
    sanitize(input: any): any;
}

class HtmlStripper implements ISanitizer {
    sanitize(input: any): any {
        if (typeof input !== 'string') {
            return input;
        }
        const temp = document.createElement('div');
        temp.innerHTML = input;
        return temp.textContent || temp.innerText || '';
    }
}

class RegexCleaner implements ISanitizer {
    private readonly regex: RegExp;

    constructor(pattern: string) {
        this.regex = new RegExp(pattern, 'g');
    }

    sanitize(input: any): any {
        if (typeof input !== 'string') {
            return input;
        }
        return input.replace(this.regex, '');
    }
}

class CharacterEncoder implements ISanitizer {
    sanitize(input: any): any {
        if (typeof input !== 'string') {
            return input;
        }
        return input.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
    }
}

export class SanitizationPipeline {
    private sanitizers: ISanitizer[];

    constructor(sanitizers: ISanitizer[]) {
        this.sanitizers = sanitizers;
    }

    public sanitize(input: any): any {
        let currentInput: any = input;
        for (const sanitizer of this.sanitizers) {
            try {
                currentInput = sanitizer.sanitize(currentInput);
            } catch (e) {
                console.error("Sanitization failed at step:", e);
                // Critical failure: return original input or throw, depending on policy.
                // For robustness, we log and return the current state.
                return currentInput;
            }
        }
        return currentInput;
    }
}

export { SanitizationPipeline, HtmlStripper, RegexCleaner, CharacterEncoder };