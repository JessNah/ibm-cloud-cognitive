/**
 * Copyright IBM Corp. 2021, 2021
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect } from 'react';

/**
 * Resets the current step of the create component if it has been closed.
 * @param {object} useResetCreateComponent - Create component that uses this custom hook
 * @param {object} useResetCreateComponent.previousState
 * @param {boolean} useResetCreateComponent.open
 * @param {Function} useResetCreateComponent.setCurrentStep
 * @param {number} useResetCreateComponent.initialStep
 * @param {number} useResetCreateComponent.totalSteps
 * @param {string} useResetCreateComponent.componentName
 */
export const useResetCreateComponent = ({
  previousState,
  open,
  setCurrentStep,
  initialStep,
  totalSteps,
  componentName,
}) => {
  useEffect(() => {
    if (!previousState?.open && open) {
      if (
        initialStep &&
        totalSteps &&
        Number(initialStep) <= Number(totalSteps) &&
        Number(initialStep) > 0
      ) {
        setCurrentStep(Number(initialStep));
      } else {
        setCurrentStep(1);
      }

      // An invalid initialStep value was provided, we'll default to rendering the first step in this scenario
      if (
        (initialStep &&
          totalSteps &&
          Number(initialStep) > Number(totalSteps)) ||
        Number(initialStep) <= 0
      ) {
        console.warn(
          `${componentName}: An invalid \`initialStep\` prop was supplied. The \`initialStep\` prop should be a number that is greater than 0 or less than or equal to the number of steps your ${componentName} has.`
        );
      }
    }
  }, [
    open,
    previousState,
    setCurrentStep,
    initialStep,
    totalSteps,
    componentName,
  ]);
};
