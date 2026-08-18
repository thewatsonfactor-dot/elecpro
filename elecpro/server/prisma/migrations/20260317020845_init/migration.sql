-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "uei" TEXT,
    "cage" TEXT,
    "naics" TEXT DEFAULT '238210',
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TakeoffSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectName" TEXT,
    "summary" TEXT,
    "generalFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sheetsUploaded" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TakeoffSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TakeoffItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "userQty" DOUBLE PRECISION,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "evidence" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TakeoffItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedBid" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "naicsCode" TEXT,
    "responseDeadline" TIMESTAMP(3),
    "postedDate" TIMESTAMP(3),
    "typeOfSetAside" TEXT,
    "baseType" TEXT,
    "state" TEXT,
    "city" TEXT,
    "description" TEXT,
    "uiLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedBid_userId_noticeId_key" ON "TrackedBid"("userId", "noticeId");

-- AddForeignKey
ALTER TABLE "TakeoffSession" ADD CONSTRAINT "TakeoffSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TakeoffItem" ADD CONSTRAINT "TakeoffItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TakeoffSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedBid" ADD CONSTRAINT "TrackedBid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
