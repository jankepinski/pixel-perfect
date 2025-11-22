export interface PixelData {
  width: number;
  height: number;
  pixels: string[]; // Hex colors
}

export class PixelProcessor {
  /**
   * Detects the likely grid size of a pixel art image.
   * Assumes the image is composed of square blocks of uniform color.
   */
  static detectGrid(imageData: ImageData): { size: number; offset: { x: number; y: number } } {
    const { width, height, data } = imageData;
    
    // Simple heuristic: Check row/col transitions
    // This is a simplified version. In a real robust app, we'd use FFT or autocorrelation.
    // For now, we'll scan a few rows and columns to find the most common run length of similar colors.

    const getPixel = (x: number, y: number) => {
      const idx = (y * width + x) * 4;
      return [data[idx], data[idx + 1], data[idx + 2]];
    };

    const colorDiff = (c1: number[], c2: number[]) => {
      return Math.abs(c1[0] - c2[0]) + Math.abs(c1[1] - c2[1]) + Math.abs(c1[2] - c2[2]);
    };

    // Scan horizontal transitions
    const transitionsX: number[] = [];
    for (let y = Math.floor(height / 2); y < Math.floor(height / 2) + 50 && y < height; y += 5) {
      let lastPixel = getPixel(0, y);
      let runLength = 0;
      for (let x = 1; x < width; x++) {
        const pixel = getPixel(x, y);
        if (colorDiff(pixel, lastPixel) > 30) { // Threshold for change
           if (runLength > 2) transitionsX.push(runLength);
           runLength = 0;
           lastPixel = pixel;
        } else {
          runLength++;
        }
      }
    }

    // Find mode of transitions (likely block size)
    const mode = (arr: number[]) => {
      if (arr.length === 0) return 1;
      const counts: Record<number, number> = {};
      let maxCount = 0;
      let maxVal = 1;
      for (const val of arr) {
        // Group similar sizes (e.g. 9, 10, 11 -> 10)
        const key = Math.round(val / 2) * 2; // Round to nearest even
        counts[key] = (counts[key] || 0) + 1;
        if (counts[key] > maxCount) {
          maxCount = counts[key];
          maxVal = key;
        }
      }
      return maxVal > 0 ? maxVal : 1;
    };

    const estimatedSize = mode(transitionsX);
    
    // Refine estimation (could be improved)
    // If we detected 0 or 1, default to a safe small number or just 1 (no scaling)
    const size = estimatedSize < 2 ? 1 : estimatedSize;

    return { size, offset: { x: 0, y: 0 } }; // TODO: Implement offset detection
  }

  /**
   * Extracts the raw pixel art data by sampling the center of each grid block.
   */
  static extractPixelArt(imageData: ImageData, gridSize: number, offset: { x: number; y: number } = { x: 0, y: 0 }): PixelData {
    const { width, height, data } = imageData;
    const cols = Math.floor((width - offset.x) / gridSize);
    const rows = Math.floor((height - offset.y) / gridSize);
    const pixels: string[] = [];

    const toHex = (r: number, g: number, b: number, a: number) => {
        if (a === 0) return 'transparent';
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    };

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Sample center of the block
        const sampleX = Math.floor(offset.x + x * gridSize + gridSize / 2);
        const sampleY = Math.floor(offset.y + y * gridSize + gridSize / 2);
        
        // Check bounds
        if (sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height) {
             pixels.push('transparent');
             continue;
        }

        const idx = (sampleY * width + sampleX) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        pixels.push(toHex(r, g, b, a));
      }
    }

    return { width: cols, height: rows, pixels };
  }

  /**
   * Removes white background by converting white/near-white pixels to transparent.
   */
  static removeBackground(pixelData: PixelData, threshold: number = 250): PixelData {
      const newPixels = pixelData.pixels.map(color => {
          if (color === 'transparent') return color;
          // Check if hex is close to white
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          
          if (r > threshold && g > threshold && b > threshold) {
              return 'transparent';
          }
          return color;
      });
      return { ...pixelData, pixels: newPixels };
  }
  /**
   * Trims the pixel data to the bounding box of non-transparent pixels.
   */
  static trimToContent(pixelData: PixelData): PixelData {
      const { width, height, pixels } = pixelData;
      let minX = width, minY = height, maxX = 0, maxY = 0;
      let hasContent = false;

      for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              if (pixels[idx] !== 'transparent') {
                  hasContent = true;
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
              }
          }
      }

      if (!hasContent) {
          return { width: 0, height: 0, pixels: [] };
      }

      const newWidth = maxX - minX + 1;
      const newHeight = maxY - minY + 1;
      const newPixels: string[] = [];

      for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
              const idx = y * width + x;
              newPixels.push(pixels[idx]);
          }
      }

      return { width: newWidth, height: newHeight, pixels: newPixels };
  }
}
