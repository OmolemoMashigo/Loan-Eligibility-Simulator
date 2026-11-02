import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CurrencyField } from './CurrencyField/CurrencyField';
import { NumberField } from './NumberField/NumberField';
import { RadioGroup } from './RadioGroup/RadioGroup';
import { SelectField } from './SelectField/SelectField';
import { TextField } from './TextField/TextField';

describe('TextField', () => {
  it('lets the user type through the labelled input', async () => {
    const user = userEvent.setup();
    render(<TextField id="full-name" name="fullName" label="Full name" />);

    const input = screen.getByRole('textbox', { name: 'Full name' });
    await user.type(input, 'Ada');

    expect(input).toHaveValue('Ada');
  });

  it('exposes hint and error to assistive tech', () => {
    render(
      <TextField
        id="notes"
        label="Notes"
        hint="Optional extra detail"
        error="Enter a note"
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Notes' });

    expect(input).toHaveAccessibleDescription(/optional extra detail/i);
    expect(input).toHaveAccessibleDescription(/enter a note/i);
    expect(input).toBeInvalid();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a note');
  });
});

describe('NumberField', () => {
  it('uses a numeric keypad and keeps autocomplete off', () => {
    render(<NumberField id="age" name="age" label="Age" />);

    const input = screen.getByRole('textbox', { name: 'Age' });

    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('type', 'text');
  });
});

describe('CurrencyField', () => {
  it('shows a decorative rand prefix and a decimal keypad', async () => {
    const user = userEvent.setup();
    render(
      <CurrencyField id="income" name="monthlyIncome" label="Monthly income" />,
    );

    const input = screen.getByRole('textbox', { name: 'Monthly income' });
    await user.type(input, '25000');

    expect(input).toHaveValue('25000');
    expect(input).toHaveAttribute('inputmode', 'decimal');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(screen.getByText('R')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('SelectField', () => {
  it('lets the user choose an option', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        id="purpose"
        name="loanPurpose"
        label="Loan purpose"
        placeholder="Select a purpose"
        options={[
          { value: 'home_improvement', label: 'Home improvement' },
          { value: 'education', label: 'Education' },
        ]}
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Loan purpose' });
    await user.selectOptions(select, 'education');

    expect(select).toHaveValue('education');
  });
});

describe('RadioGroup', () => {
  it('lets the user pick one option from the group', async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup
        name="employmentStatus"
        legend="Employment status"
        options={[
          { value: 'employed', label: 'Employed' },
          { value: 'unemployed', label: 'Unemployed' },
        ]}
      />,
    );

    expect(
      screen.getByRole('group', { name: 'Employment status' }),
    ).toBeInTheDocument();

    const unemployed = screen.getByRole('radio', { name: 'Unemployed' });
    await user.click(unemployed);

    expect(unemployed).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Employed' })).not.toBeChecked();
  });

  it('shows an icon before a label without making it part of the name', () => {
    render(
      <RadioGroup
        name="purpose"
        legend="Purpose"
        options={[
          {
            value: 'education',
            label: 'Education',
            icon: <svg data-testid="icon" />,
          },
          { value: 'other', label: 'Other' },
        ]}
      />,
    );

    expect(screen.getByTestId('icon').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(
      screen.getByRole('radio', { name: 'Education' }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('icon')).toHaveLength(1);
  });
});
