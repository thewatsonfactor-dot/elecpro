import { Router } from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { analyzePlans } from "../services/claude";
import { AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// POST /api/analyze — upload PDFs, run AI takeoff
router.post("/", upload.array("plans", 10), async (req: AuthRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Upload at least one PDF" });
    }

    const nonPdf = files.find((f) => f.mimetype !== "application/pdf");
    if (nonPdf) {
      return res.status(400).json({ error: `File "${nonPdf.originalname}" is not a PDF` });
    }

    const pdfBuffers = files.map((f) => f.buffer);
    const result = await analyzePlans(pdfBuffers);

    // Persist session and items
    const session = await prisma.takeoffSession.create({
      data: {
        userId: req.userId!,
        projectName: (req.body.projectName as string) || "Untitled Takeoff",
        summary: result.projectSummary,
        generalFlags: result.generalFlags,
        sheetsUploaded: files.map((f) => f.originalname),
        items: {
          create: result.items.map((item) => ({
            itemCode: item.id,
            category: item.category,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            confidence: item.confidence,
            tier: item.tier,
            evidence: JSON.stringify(item.evidence),
          })),
        },
      },
      include: { items: true },
    });

    res.json({
      sessionId: session.id,
      projectSummary: result.projectSummary,
      sheetsIdentified: result.sheetsIdentified,
      generalFlags: result.generalFlags,
      estimatorNotes: result.estimatorNotes,
      items: session.items.map((item) => ({
        id: item.id,
        itemCode: item.itemCode,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        confidence: item.confidence,
        tier: item.tier,
        status: item.status,
        userQty: item.userQty,
        unitCost: item.unitCost,
        notes: item.notes,
        evidence: JSON.parse(item.evidence),
      })),
    });
  } catch (err: any) {
    console.error("Analyze error:", err);
    res.status(500).json({ error: err.message || "Analysis failed" });
  }
});

export { router as analyzeRouter };
