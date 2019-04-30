import { Insightful } from 'types/insightful';

/**
 * Count words in AST node.
 */
export function countWords(node: Insightful.AST | string): number {
  // Count words in string
  if (typeof node == 'string') {
    const text = node.trim();
    return !text ? 0 : text.split(/\s+|\-+/).length;
  }

  // Count words recursively in child nodes
  let words = 0;
  for (let child of node.c) words += countWords(child);
  return words;
}
