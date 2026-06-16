import type { DiffLine, DiffBlock, DiffOperation } from '@/types';

const LOOKAHEAD_WINDOW = 3;

export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      result.push({ type: 'unchanged', content: oldLines[i], lineNumber: i + 1 });
      i++;
      j++;
      continue;
    }

    const match = findMatchAhead(oldLines, newLines, i, j);

    if (match) {
      const [matchOldIdx, matchNewIdx] = match;

      for (let k = i; k < matchOldIdx; k++) {
        result.push({ type: 'removed', content: oldLines[k], lineNumber: k + 1 });
      }

      for (let l = j; l < matchNewIdx; l++) {
        result.push({ type: 'added', content: newLines[l], lineNumber: l + 1 });
      }

      result.push({ type: 'unchanged', content: oldLines[matchOldIdx], lineNumber: matchOldIdx + 1 });

      i = matchOldIdx + 1;
      j = matchNewIdx + 1;
    } else {
      if (i < oldLines.length && j < newLines.length) {
        result.push({ type: 'removed', content: oldLines[i], lineNumber: i + 1 });
        i++;
      } else if (i < oldLines.length) {
        result.push({ type: 'removed', content: oldLines[i], lineNumber: i + 1 });
        i++;
      } else {
        result.push({ type: 'added', content: newLines[j], lineNumber: j + 1 });
        j++;
      }
    }
  }

  return result;
}

function findMatchAhead(
  oldLines: string[],
  newLines: string[],
  startI: number,
  startJ: number
): [number, number] | null {
  const endI = Math.min(startI + LOOKAHEAD_WINDOW, oldLines.length);
  const endJ = Math.min(startJ + LOOKAHEAD_WINDOW, newLines.length);

  for (let offset = 1; offset <= Math.max(LOOKAHEAD_WINDOW, endI - startI, endJ - startJ); offset++) {
    const candidates: [number, number][] = [];

    for (let k = 0; k <= offset && startI + k < endI; k++) {
      const l = offset - k;
      if (l >= 0 && l <= offset && startJ + l < endJ) {
        candidates.push([startI + k, startJ + l]);
      }
    }

    for (const [oi, nj] of candidates) {
      if (oi >= startI && nj >= startJ && (oi > startI || nj > startJ) && oldLines[oi] === newLines[nj]) {
        return [oi, nj];
      }
    }
  }

  return null;
}

const HEADING_REGEX = /^#{1,6}\s/;

export function groupDiffToBlocks(lines: DiffLine[]): DiffBlock[] {
  if (lines.length === 0) {
    return [];
  }

  const blocks: DiffBlock[] = [];
  let currentType: DiffOperation = lines[0].type;
  let currentLines: DiffLine[] = [lines[0]];

  for (let idx = 1; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.type === currentType) {
      currentLines.push(line);
    } else {
      blocks.push(buildBlock(currentType, currentLines));
      currentType = line.type;
      currentLines = [line];
    }
  }

  blocks.push(buildBlock(currentType, currentLines));
  return blocks;
}

function buildBlock(type: DiffOperation, lines: DiffLine[]): DiffBlock {
  const block: DiffBlock = { type, lines };

  for (const line of lines) {
    if (HEADING_REGEX.test(line.content)) {
      block.heading = line.content.replace(/^#+\s*/, '').trim();
      break;
    }
  }

  return block;
}

export function detectModifiedBlocks(blocks: DiffBlock[]): DiffBlock[] {
  const result: DiffBlock[] = [];

  for (let idx = 0; idx < blocks.length; idx++) {
    const current = blocks[idx];
    const next = blocks[idx + 1];

    if (
      current.type === 'removed' &&
      next &&
      next.type === 'added' &&
      Math.abs(current.lines.length - next.lines.length) <= 3
    ) {
      result.push({
        type: 'modified',
        lines: [...current.lines, ...next.lines],
        heading: current.heading || next.heading,
      });
      idx++;
    } else {
      result.push(current);
    }
  }

  return result;
}

export function generateSummary(oldText: string, newText: string) {
  const diffLines = computeLineDiff(oldText, newText);
  const blocks = detectModifiedBlocks(groupDiffToBlocks(diffLines));

  let addedLines = 0;
  let removedLines = 0;
  let unchangedLines = 0;
  let modifiedBlocks = 0;

  for (const block of blocks) {
    if (block.type === 'modified') {
      modifiedBlocks++;
      for (const line of block.lines) {
        if (line.type === 'added') addedLines++;
        else if (line.type === 'removed') removedLines++;
      }
    } else {
      for (const line of block.lines) {
        if (line.type === 'added') addedLines++;
        else if (line.type === 'removed') removedLines++;
        else if (line.type === 'unchanged') unchangedLines++;
      }
    }
  }

  const totalOldLines = oldText === '' ? 0 : oldText.split('\n').length;
  const totalNewLines = newText === '' ? 0 : newText.split('\n').length;

  return {
    addedLines,
    removedLines,
    unchangedLines,
    modifiedBlocks,
    totalOldLines,
    totalNewLines,
  };
}
