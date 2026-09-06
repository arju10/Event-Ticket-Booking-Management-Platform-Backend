import { z } from "zod";
import { updateMeSchema } from "./user.validation";

export type UpdateMeInput = z.infer<typeof updateMeSchema>["body"];
