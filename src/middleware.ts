import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers["authorization"];

    if (!header) {
      return res.status(401).json({ message: "Authorization header missing" });
    }
    try {
      const decoded = jwt.verify(
        header as string,
        process.env.JWT_SECRET as string
      );

      if (decoded) {
        // not ideal but for now its fine.
        //@ts-ignore
        req.userId = decoded.userId;
      }

      next();
    } catch (err) {
      return res.status(403).json({
        message: "You are not logged in",
      });
    }
  } catch (err) {
    console.log("User middleware error", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
