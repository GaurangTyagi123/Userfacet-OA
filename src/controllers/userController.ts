/**
 * src/controllers/userController.ts
 * User controller: handles user CRUD, profile, and related user operations.
 * Exports controller functions consumed by the user router.
 */
import type { AppRequest, AppResponse, Nextfn } from "../../types.js";
import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import checkRequestBody from "../utils/checkRequestBody.js";

export const getUser = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const id = req.params.id;
        if (!id)
            return next(new AppError("Please provide a valid user id", 400));

        const user = await User.findById(id);
        if (!user) return next(new AppError("No such user exists", 400));

        return res.status(200).json({
            status: "success",
            data: {
                user,
            },
        });
    },
);

export const updateUser = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        if (req.body.password || req.body.confirmPassword)
            return next(new AppError("Password cannot be updated here", 400));
        let newData = req.body;
        newData = checkRequestBody(newData, ["role", "passwordUpdatedAt"]);
        let updatedUser;
        if (newData.email) {
            newData.isVerified = false;
            updatedUser = await User.findByIdAndUpdate(req.user?._id, newData, {
                new: true,
                runValidators: true,
            });
        } else
            updatedUser = await User.findByIdAndUpdate(req.user?._id, newData, {
                returnDocument: "after",
                runValidators: true,
            }).select("-__v");
        if (!updateUser) return next(new AppError("There was an error", 500));
        return res.status(200).json({
            status: "success",
            data: {
                updatedUser,
            },
        });
    },
);
export const changeRole = catchAsync(
    async (req: AppRequest, res: AppResponse, next: Nextfn) => {
        const { role, userId } = req.body;
        if (!role || !userId)
            return next(new AppError("Please provide a role", 400));
        const user = await User.findById(userId);
        if (!user)
            return next(new AppError("User with this id does not exists", 400));
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                role: role,
            },
            {
                returnDocument: "after",
            },
        );
        if (!updatedUser)
            return next(
                new AppError(
                    "There was an error in updating the user's role",
                    500,
                ),
            );
        return res.status(200).json({
            status: "success",
            data: {
                user: updatedUser,
            },
        });
    },
);
