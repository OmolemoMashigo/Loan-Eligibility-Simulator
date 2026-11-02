import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StepTabs, type StepTabsProps } from './StepTabs';
import { stepPanelId, stepTabId } from './ids';

const STEPS = [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }];

function renderTabs(props: Partial<StepTabsProps> = {}) {
  const onSelect = vi.fn();

  render(
    <StepTabs
      label="Steps"
      steps={STEPS}
      active={0}
      reached={0}
      done={0}
      idPrefix="s"
      onSelect={onSelect}
      {...props}
    />,
  );

  return { onSelect, user: userEvent.setup() };
}

function tab(name: string): HTMLElement {
  return screen.getByRole('tab', { name: new RegExp(`^${name}`) });
}

describe('StepTabs', () => {
  afterEach(cleanup);

  it('is a named tab list with the active step selected', () => {
    renderTabs({ active: 1, reached: 1, done: 1 });

    expect(screen.getByRole('tablist', { name: 'Steps' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(tab('One')).toHaveAttribute('aria-selected', 'false');
    expect(tab('Two')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Two')).toHaveAttribute('tabindex', '0');
    expect(tab('One')).toHaveAttribute('tabindex', '-1');
  });

  it('joins each tab to its panel by id', () => {
    renderTabs();

    expect(tab('Two')).toHaveAttribute('id', stepTabId('s', 1));
    expect(tab('Two')).toHaveAttribute('aria-controls', stepPanelId('s', 1));
  });

  it('greys out and disables the steps that cannot be opened yet', async () => {
    const { onSelect, user } = renderTabs({ reached: 1, done: 1 });

    expect(tab('One')).toBeEnabled();
    expect(tab('Two')).toBeEnabled();
    expect(tab('Three')).toBeDisabled();

    await user.click(tab('Three'));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('reports the step that was clicked', async () => {
    const { onSelect, user } = renderTabs({ active: 1, reached: 1, done: 1 });

    await user.click(tab('One'));

    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('says which steps are completed', () => {
    renderTabs({ active: 2, reached: 2, done: 2 });

    expect(
      screen.getByRole('tab', { name: /^One\s?, completed$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /^Two\s?, completed$/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Three' })).toBeInTheDocument();
  });

  it('moves focus with the arrow keys, skipping locked steps and wrapping', async () => {
    const { onSelect, user } = renderTabs({ reached: 1, done: 1 });

    tab('One').focus();
    await user.keyboard('{ArrowRight}');

    expect(tab('Two')).toHaveFocus();

    // Step three is locked, so the next stop wraps back to the first.
    await user.keyboard('{ArrowRight}');

    expect(tab('One')).toHaveFocus();

    await user.keyboard('{ArrowLeft}');

    expect(tab('Two')).toHaveFocus();
    // Moving focus does not open a step; Enter or Space does.
    expect(onSelect).not.toHaveBeenCalled();

    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('jumps to the first and last open step with Home and End', async () => {
    const { user } = renderTabs({ active: 1, reached: 2, done: 2 });

    tab('Two').focus();
    await user.keyboard('{End}');

    expect(tab('Three')).toHaveFocus();

    await user.keyboard('{Home}');

    expect(tab('One')).toHaveFocus();
  });
});
