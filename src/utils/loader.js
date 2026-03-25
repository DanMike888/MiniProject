import ora from 'ora';

export function createSpinner(text) {
  return ora({ text, spinner: 'dots', color: 'cyan' });
}

export async function withSpinner(text, fn) {
  const spinner = createSpinner(text);
  spinner.start();
  try {
    return await fn(spinner);
  } catch (err) {
    spinner.fail(err.message || 'Operation failed');
    throw err;
  }
}
