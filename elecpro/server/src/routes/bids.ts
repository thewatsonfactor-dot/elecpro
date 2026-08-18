import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /api/bids — list tracked bids
router.get("/", async (req: AuthRequest, res) => {
  const bids = await prisma.trackedBid.findMany({
    where: { userId: req.userId! },
    orderBy: { responseDeadline: "asc" },
  });
  res.json(bids);
});

// POST /api/bids — track a bid
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { noticeId, title, department, naicsCode, responseDeadline, postedDate, typeOfSetAside, baseType, state, city, description, uiLink } = req.body;

    const bid = await prisma.trackedBid.upsert({
      where: { userId_noticeId: { userId: req.userId!, noticeId } },
      update: {},
      create: {
        userId: req.userId!,
        noticeId,
        title,
        department,
        naicsCode,
        responseDeadline: responseDeadline ? new Date(responseDeadline) : null,
        postedDate: postedDate ? new Date(postedDate) : null,
        typeOfSetAside,
        baseType,
        state,
        city,
        description,
        uiLink,
      },
    });
    res.json(bid);
  } catch (err: any) {
    console.error("Track bid error:", err);
    res.status(500).json({ error: "Failed to track bid" });
  }
});

// DELETE /api/bids/:noticeId — untrack a bid
router.delete("/:noticeId", async (req: AuthRequest, res) => {
  try {
    await prisma.trackedBid.deleteMany({
      where: { userId: req.userId!, noticeId: req.params.noticeId as string },
    });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("Remove bid error:", err);
    res.status(500).json({ error: "Failed to remove bid" });
  }
});

export { router as bidsRouter };
