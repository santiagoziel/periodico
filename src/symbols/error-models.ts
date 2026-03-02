export type KnownError<E = object> = { type: "known"; error: string; details?: E };
export type UnknownError = { type: "unknown"; error: object; details?: string };
export type ExpectedError = { type: "expected"; error: string };
export type GeneralError<E = object> = KnownError<E> | UnknownError | ExpectedError;

export const expectedError = (error: string): ExpectedError => ({ type: "expected", error });
export const weExpectedThisInThe = <E = object>(error: GeneralError<E>): error is ExpectedError => error.type === "expected";

export const knownError = <E extends object = object>(error: string, details: E = {} as E): KnownError<E> => ({ type: "known", error, details });
export const unknownError = (error: object, details?: string): UnknownError =>
  details ? { type: "unknown", error, details } : { type: "unknown", error };

export const weKnowWhatHappenedInThe = <E = object>(error: GeneralError<E>): error is KnownError<E> => error.type === "known";
export const weDontKnowWhatHappenedInThe = <E = object>(error: GeneralError<E>): error is UnknownError => error.type === "unknown";

export const errorWithContext = <E extends object = object>(context: string, generalError: GeneralError<E>): GeneralError<E> => {
    if (weExpectedThisInThe(generalError)) return generalError;
    if (weKnowWhatHappenedInThe(generalError)) {
      return knownError(`${context}: ${generalError.error}`, generalError.details);
    } else {
      return unknownError(generalError.error, generalError.details ? `${context}: ${generalError.details}` : context);
    }
  };

const safeStringify = (obj: unknown, onFail: () => void): string | null => {
  try {
    return JSON.stringify(obj, null, 4);
  } catch (e) {
    onFail();
    return null;
  }
};

export const theParsedErrorFromThe = <E extends object = object>(
  error: GeneralError<E>,
  logger?: (message: object) => void
): string => {
  if (weExpectedThisInThe(error)) return error.error;
  if (weDontKnowWhatHappenedInThe(error)) {
    const message = error.details ?? "Unknown error";
    if (logger) {
      logger(error.error);
      return message;
    }
    const payload =
      safeStringify(error.error, () => console.error("Could not stringify error payload", error.error)) ??
      `Unknown unserializable error\n${error.details ?? ""}`;
    return `${message}\n${payload}`;
  }

  // Known error
  if (logger) {
    if (error.details) logger(error.details);
    return error.error;
  }
  if (!error.details) return error.error;

  const payload =
    safeStringify(error.details, () => console.error("Could not stringify error payload", error.details)) ??
    `known unserializable error\n${error.details}`;
  return `${error.error}\n${payload}`;
};