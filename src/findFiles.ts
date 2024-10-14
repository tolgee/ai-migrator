import glob from 'fast-glob';

export const findFiles = async (pattern: string | string[]): Promise<string []> => {
    try {
        // Get all the files that match the patterns
        const files = await glob(pattern, {onlyFiles: true});

        if (files.length === 0) {
            console.error(`No files matched the pattern: ${pattern}`);
            return [];
        }

        return files as string[];
    } catch (error) {
        console.error(`Error while finding files: ${error}`);
        return [];
    }
};