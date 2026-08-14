/**
 * src/utils/catchAsync.ts
 * Helper wrapper to catch errors in async Express route handlers and forward
 * them to the next error middleware. Usage: `catchAsync(async (req,res)=>{})`.
 */
import type { AppRequest, AppResponse, Nextfn } from "../../types.js";

// eslint-disable-next-line
const catchAsync = (fn: Function) => {
    return (req: AppRequest, res: AppResponse, next: Nextfn) => {
        fn(req, res, next).catch(next);
    };
};
export default catchAsync;
