/**
 * src/utils/checkRequestBody.ts
 * Small helper to validate required properties exist on the request body.
 * Returns a filtered copy of the body containing only included or excluded
 * fields depending on the `include` flag.
 */
export default (
    body: Record<string, string>,
    fields: Array<string>,
    include: boolean = false,
) => {
    const newBody: Record<string, string> = Object();
    Object.keys(body).forEach((field) => {
        if (!include && !fields.includes(field)) newBody[field] = body[field];
        else if (include && fields.includes(field))
            newBody[field] = body[field];
    });
    return newBody;
};
