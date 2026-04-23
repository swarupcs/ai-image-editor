/**
 * Utility functions for calculating the credit cost of operations.
 * Shared between client (for warnings) and server (for enforcement).
 */

export type EditOperationOptions = {
  hasMask?: boolean;
  userFilesCount?: number;
  isFilter?: boolean;
};

/**
 * Calculates the maximum total credit cost for an edit operation.
 * Formula: Base Image (1) + Mask (1) + User Files (N) + Filter (1) + Output Generation (1)
 */
export function calculateEditCost(options?: EditOperationOptions): number {
  let cost = 1; // Base cost for processing the input image
  
  if (options?.hasMask) {
    cost += 1;
  }
  
  if (options?.userFilesCount) {
    cost += options.userFilesCount;
  }
  
  if (options?.isFilter) {
    cost += 1;
  }
  
  // Final generation cost (the AI returns 1 image for edits)
  cost += 1;
  
  return cost;
}

/**
 * Calculates the maximum total credit cost for a text-to-image generation.
 * Formula: Upfront Request (1) + Max Candidate Outputs (4) = 5
 */
export function calculateGenerateCost(): number {
  // We request up to 4 candidates, plus 1 for the prompt processing
  return 5;
}
