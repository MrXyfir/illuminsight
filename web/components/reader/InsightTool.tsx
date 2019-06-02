import { createStyles, WithStyles, withStyles, Theme } from '@material-ui/core';
import { getInsights } from 'lib/reader/get-insights';
import { Insightful } from 'types/insightful';
import * as React from 'react';

const styles = (theme: Theme) =>
  createStyles({
    tool: {
      backgroundColor: theme.palette.grey[400],
      position: 'absolute',
      height: '3em',
      width: '0.8em',
      top: '50%',
      left: '0%'
    }
  });

function _InsightTool({
  onChange,
  insights,
  classes
}: {
  onChange: (insights: Insightful.Insights) => void;
  insights: Insightful.Insights;
} & WithStyles<typeof styles>) {
  /**
   * Get element to parse insights from.
   */
  function getElement(x: number, y: number): HTMLElement | undefined {
    // Get elements to right of tool
    let elements = document.elementsFromPoint(x, y) as HTMLElement[];

    // Remove #ast and any ancestors
    elements.splice(elements.findIndex(el => el.id == 'ast'), elements.length);

    // Reverse list so it's [parent,child]
    elements.reverse();

    // Ignore if parent element lacks text content
    if (!elements.length || !elements[0].innerText) return;

    // Get last block element
    let block: HTMLElement | undefined = undefined;
    for (let el of elements) {
      if (getComputedStyle(el).display == 'block') block = el;
    }
    if (!block) return;

    // Element is probably a container
    if (
      block.tagName == 'DIV' &&
      elements.slice(-1)[0] === block &&
      block.innerText.length > 10 * 1000
    )
      return;

    return block;
  }

  /**
   * Handle clicks to insight tool
   */
  function onClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    // Get elements
    const tool = event.target as HTMLDivElement;
    const ast = document.getElementById('ast')!;

    // Get needed x/y coordinates
    // Need x from #ast because of its dynamic width/margin
    const { x } = ast.getBoundingClientRect() as DOMRect;
    const { y } = tool.getBoundingClientRect() as DOMRect;

    // Get line height of AST container
    const lineHeight = +getComputedStyle(ast)!.lineHeight!.split('px')[0];

    // Find adjacent element with a bit of guesswork
    let element: HTMLElement | undefined = undefined;
    for (let i = 0; i < 3; i++) {
      element = getElement(x + 1, y + i * lineHeight);
      if (element) break;
    }
    if (!element) return;

    // Get index of AST element
    const index = +element.getAttribute('ast')!;

    // Remove insights
    if (insights[index]) delete insights[index];
    // Parse insights from element's text
    else insights[index] = getInsights(element.innerText);

    // Send modified insights back to Reader
    onChange(insights);
  }

  return (
    <div title="Insight tool" onClick={onClick} className={classes.tool} />
  );
}

export const InsightTool = withStyles(styles)(_InsightTool);
