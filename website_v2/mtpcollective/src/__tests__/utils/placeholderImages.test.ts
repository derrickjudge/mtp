import { getPlaceholderImage, placeholderImages } from '@/utils/placeholderImages';

describe('placeholderImages', () => {
  it('generates correct URL for given dimensions and id', () => {
    const url = getPlaceholderImage({ width: 800, height: 600, id: 'test' });
    expect(url).toBe('https://picsum.photos/seed/test/800/600');
  });

  it('has all required placeholder images defined', () => {
    expect(placeholderImages).toHaveProperty('hero');
    expect(placeholderImages).toHaveProperty('featured1');
    expect(placeholderImages).toHaveProperty('featured2');
    expect(placeholderImages).toHaveProperty('featured3');
    expect(placeholderImages).toHaveProperty('concert');
    expect(placeholderImages).toHaveProperty('automotive');
    expect(placeholderImages).toHaveProperty('nature');
  });

  it('generates unique URLs for different ids', () => {
    const url1 = getPlaceholderImage({ width: 800, height: 600, id: 'test1' });
    const url2 = getPlaceholderImage({ width: 800, height: 600, id: 'test2' });
    expect(url1).not.toBe(url2);
  });

  it('maintains consistent URLs for same id', () => {
    const url1 = getPlaceholderImage({ width: 800, height: 600, id: 'test' });
    const url2 = getPlaceholderImage({ width: 800, height: 600, id: 'test' });
    expect(url1).toBe(url2);
  });
}); 