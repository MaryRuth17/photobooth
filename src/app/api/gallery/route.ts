import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const photos = await prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
    });
    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Error fetching gallery photos", error);
    return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { imageData } = await request.json();

    if (typeof imageData !== "string" || !imageData.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    const photo = await prisma.photo.create({
      data: { imageData },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error("Error saving gallery photo", error);
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 });
  }
}

