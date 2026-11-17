import DOMPurify from 'dompurify';
export declare class HtmlUtil {
    static sanitize(html: string, config?: DOMPurify.Config): string;
}
