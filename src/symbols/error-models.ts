export type KnownError<E = object> = { type: "known"; error: string; details?: E };
export type UnknownError = { type: "unknown"; error: object; details?: string };
export type GeneralError<E = object> = KnownError<E> | UnknownError;

export const knownError = <E extends object = object>(error: string, details: E = {} as E): KnownError<E> => ({ type: "known", error, details });
export const unknownError = (error: object, details?: string): UnknownError =>
  details ? { type: "unknown", error, details } : { type: "unknown", error };

export const weKnowWhatHappenedInThe = <E = object>(error: GeneralError<E>): error is KnownError<E> => error.type === "known";
export const weDontKnowWhatHappenedInThe = <E = object>(error: GeneralError<E>): error is UnknownError => error.type === "unknown";

export const errorWithContext = <E extends object = object>(context: string, generalError: GeneralError<E>): GeneralError<E> => {
    if (weKnowWhatHappenedInThe(generalError)) {
      return knownError(`${context}: ${generalError.error}`, generalError.details);
    } else {
      return unknownError(generalError.error, generalError.details ? `${context}: ${generalError.details}` : context);
    }
  };

 export const theParsedErrorFrom = <E extends object = object>(error: GeneralError<E>, logger: (error: object) => void): string => {
    if (weDontKnowWhatHappenedInThe(error)) {
      logger(error.error);
      const errorMessage = error.details ?? "Unknown error";
      return errorMessage;
    } else {
      if (error.details) {
        logger(error.details);
      }
      return error.error;
    }
  };