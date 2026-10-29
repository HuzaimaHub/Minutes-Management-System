export interface PasswordChecks {
  length: boolean;
  letter: boolean;
  number: boolean;
}

export function checkPassword(password: string): PasswordChecks {
  return {
    length: password.length >= 8 && password.length <= 72,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  };
}

export function passwordOk(password: string): boolean {
  const c = checkPassword(password);
  return c.length && c.letter && c.number;
}