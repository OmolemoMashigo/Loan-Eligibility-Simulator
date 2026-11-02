import { useRef, type KeyboardEvent } from 'react';
import { cx } from '@/components/cx';
import { stepPanelId, stepTabId } from './ids';
import styles from './StepTabs.module.css';

export type StepTabsProps = {
  /** Names the group for assistive technology, such as "Form steps". */
  label: string;
  steps: readonly { label: string }[];
  /** The step on screen. */
  active: number;
  /** The furthest step that can be opened. Later steps are greyed out. */
  reached: number;
  /** How many steps, counting from the first, are finished. */
  done: number;
  /** Joins each tab to its panel; the panels use the same prefix. */
  idPrefix: string;
  onSelect: (index: number) => void;
};

/**
 * A segmented step bar. Steps beyond `reached` are disabled. The arrow keys
 * move between the steps that can be opened; Enter or Space opens one.
 */
export function StepTabs({
  label,
  steps,
  active,
  reached,
  done,
  idPrefix,
  onSelect,
}: StepTabsProps) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const open = steps.flatMap((_, index) => (index <= reached ? [index] : []));
    const focused = tabs.current.findIndex(
      (tab) => tab === document.activeElement,
    );
    const position = open.indexOf(focused);
    const target =
      event.key === 'ArrowRight'
        ? open[(position + 1) % open.length]
        : event.key === 'ArrowLeft'
          ? open[(position - 1 + open.length) % open.length]
          : event.key === 'Home'
            ? open[0]
            : event.key === 'End'
              ? open[open.length - 1]
              : undefined;

    if (target !== undefined && position !== -1) {
      event.preventDefault();
      tabs.current[target]?.focus();
    }
  }

  return (
    <div className={styles.list} role="tablist" aria-label={label}>
      {steps.map((step, index) => {
        const selected = index === active;
        const finished = index < done;

        return (
          <button
            key={step.label}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            id={stepTabId(idPrefix, index)}
            className={cx(styles.tab, finished && styles.finished)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={stepPanelId(idPrefix, index)}
            tabIndex={selected ? 0 : -1}
            disabled={index > reached}
            onClick={() => {
              onSelect(index);
            }}
            onKeyDown={onKeyDown}
          >
            <span className={styles.badge} aria-hidden="true">
              {finished ? <CheckIcon /> : index + 1}
            </span>
            <span className={styles.label}>
              {step.label}
              {finished ? (
                <span className={styles.visuallyHidden}>, completed</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
