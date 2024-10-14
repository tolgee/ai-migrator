import {findFiles} from '../src/findFiles';
import fastGlob from 'fast-glob';

jest.mock('fast-glob');

describe('findFiles', () => {
    it('should return a list of files based on a pattern', async () => {
        const mockFiles = ['file1.tsx', 'file2.tsx'];

        (fastGlob as unknown as jest.Mock).mockResolvedValue(mockFiles);

        const files = await findFiles('src/**/*.tsx');
        expect(files).toEqual(mockFiles);
    });

    it('should handle no files found', async () => {
        (fastGlob as unknown as jest.Mock).mockResolvedValue([]);

        const files = await findFiles('src/**/*.tsx');
        expect(files).toEqual([]);
    });
});
