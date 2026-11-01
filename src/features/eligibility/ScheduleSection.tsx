import { isApiError, useRepaymentSchedule } from '@/api';
import type { CalculateRateRequest } from '@/api';
import { RepaymentSchedule } from './RepaymentSchedule';

/**
 * Loads the schedule for one request. While a changed request loads, the
 * last schedule stays on screen, marked as updating.
 */
export function ScheduleSection({
  request,
}: {
  request: CalculateRateRequest;
}) {
  const schedule = useRepaymentSchedule(request);

  if (schedule.isError) {
    return (
      <RepaymentSchedule
        status="error"
        message={
          isApiError(schedule.error)
            ? schedule.error.message
            : 'Please try again.'
        }
        onRetry={() => {
          void schedule.refetch();
        }}
      />
    );
  }

  if (schedule.data) {
    return (
      <RepaymentSchedule
        status="ready"
        schedule={schedule.data.paymentSchedule}
        // The schedule's own principal, so a kept-over schedule is not
        // captioned with the newer request's amount.
        loanAmount={Math.round(
          schedule.data.totalRepayment - schedule.data.totalInterest,
        )}
        updating={schedule.isPlaceholderData}
      />
    );
  }

  return <RepaymentSchedule status="loading" />;
}
