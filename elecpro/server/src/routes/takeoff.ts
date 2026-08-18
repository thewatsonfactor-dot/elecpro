import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /api/takeoff — list sessions
router.get("/", async (req: AuthRequest, res) => {
  const sessions = await prisma.takeoffSession.findMany({
    where: { userId: req.userId! as string },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  res.json(
    sessions.map((s) => ({
      ...s,
      items: s.items.map((item) => ({ ...item, evidence: JSON.parse(item.evidence) })),
    }))
  );
});

// GET /api/takeoff/:id — get single session
router.get("/:id", async (req: AuthRequest, res) => {
  const session = await prisma.takeoffSession.findFirst({
    where: { id: req.params.id as string, userId: req.userId! as string },
    include: { items: true },
  });
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json({
    ...session,
    items: session.items.map((item) => ({ ...item, evidence: JSON.parse(item.evidence) })),
  });
});

// PATCH /api/takeoff/items/:id — update a takeoff item (approve, modify qty, add notes)
router.patch("/items/:id", async (req: AuthRequest, res) => {
  const { status, userQty, unitCost, notes } = req.body;
  const item = await prisma.takeoffItem.findUnique({
    where: { id: req.params.id as string },
  });
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  // Verify ownership via session
  const session = await prisma.takeoffSession.findUnique({ where: { id: item.sessionId } });
  if (!session || session.userId !== req.userId!) {
    return res.status(404).json({ error: "Item not found" });
  }

  const updated = await prisma.takeoffItem.update({
    where: { id: req.params.id as string },
    data: {
      ...(status !== undefined && { status }),
      ...(userQty !== undefined && { userQty }),
      ...(unitCost !== undefined && { unitCost }),
      ...(notes !== undefined && { notes }),
    },
  });
  res.json({ ...updated, evidence: JSON.parse(updated.evidence) });
});

export { router as takeoffRouter };
