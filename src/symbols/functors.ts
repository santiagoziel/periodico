import { GeneralError } from "./error-models"

export type Success<A extends object> = {is: "Successful" } & A
export type Failure<B extends object> = {is: "Failed" } & B
export type Attempt<A extends object,B extends object> = Success<A> | Failure<B>
export type AttemptToFetch<A extends object> = Promise<Attempt<A, GeneralError>>

export type Unit = {}
export const unit: Unit = {}

export const success = <A extends object>(a: A): Success<A> => ({is: "Successful", ...a})
export const failure = <B extends object>(b: B): Failure<B> => ({is: "Failed", ...b})

export const failedThe = <A extends object, B extends object>(v: Attempt<A, B>): v is Failure<B> => v.is === "Failed";
export const succeededInThe = <A extends object, B extends object>(v: Attempt<A, B>): v is Success<A> => v.is === "Successful";

export const payloadFromTheFailed = <B extends object>(v: Failure<B>): B => {
    const { is, ...failure } = v;
    return failure as B;
};

export const payloadFromTheSuccessful = <A extends object>(v: Success<A>): A => {
    const { is, ...success } = v;
    return success as A;
};

//Kleisli categorical composition
export const tryTo = <A extends object, B extends object, E extends object, R extends Attempt<B, E> | Promise<Attempt<B, E>>>
(f: (x: A) => R, attempt: Attempt<A, E>): R => 
    (failedThe(attempt) ? attempt : f(payloadFromTheSuccessful(attempt))) as R;

export const lifted = <A extends object, B extends object>
(f: (x: A) => B): (a: A) => Success<B> =>
  (a: A): Success<B> => success(f(a));

export const attemptTo = <A extends object, B extends object, E extends object>(
    f: (x: A) => B | Promise<B>,
    attempt: Attempt<A, E>
): Attempt<B, E> | Promise<Attempt<B, E>> => {
    const liftedOrAsync = (x: A) => {
        const result = f(x);
        return result instanceof Promise ? result.then(success) : success(result);
    };
    return tryTo(liftedOrAsync, attempt);
};

export const reframeTheFailed = <A extends object, E extends object, F extends object>
(attempt: Attempt<A, E>, f: (e: E) => F): Attempt<A, F> =>
    succeededInThe(attempt) ? attempt : failure(f(payloadFromTheFailed(attempt)));

export const resolveThe = <A extends object, E extends object, R>
(attempt: Attempt<A, E>, onSuccess: (a: A) => R, onFailure: (e: E) => R): R =>
    succeededInThe(attempt) 
        ? onSuccess(payloadFromTheSuccessful(attempt)) 
        : onFailure(payloadFromTheFailed(attempt));

export const buildSuccessPayloadFrom = <A extends object, E extends object>
(attempt: Attempt<A, E>, fromFailure: (e: E) => A): A =>
    succeededInThe(attempt) 
        ? payloadFromTheSuccessful(attempt) 
        : fromFailure(payloadFromTheFailed(attempt));