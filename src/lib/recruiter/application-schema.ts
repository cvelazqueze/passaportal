import { z } from "zod";
import { ApplicationStage } from "@prisma/client";

export const applicationStageSchema = z.object({
  stage: z.nativeEnum(ApplicationStage),
  reason: z.string().optional().nullable(),
});
