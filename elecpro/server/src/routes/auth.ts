import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signToken } from "../middleware/auth";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  company: z.string().optional(),
  uei: z.string().optional(),
  cage: z.string().optional(),
  naics: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
    });

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, company: user.company, uei: user.uei, cage: user.cage, naics: user.naics, phone: user.phone, address: user.address },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, company: user.company, uei: user.uei, cage: user.cage, naics: user.naics, phone: user.phone, address: user.address },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
  try {
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.default.verify(header.slice(7), process.env.JWT_SECRET || "elecpro-dev-secret") as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, email: user.email, name: user.name, company: user.company, uei: user.uei, cage: user.cage, naics: user.naics, phone: user.phone, address: user.address });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export { router as authRouter };
