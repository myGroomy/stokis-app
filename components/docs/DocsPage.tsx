"use client";

import React from "react";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocsPageNav } from "@/components/docs/DocsPageNav";

interface DocsPageProps {
  children: React.ReactNode;
  tocItems?: { id: string; label: string; labelEn?: string; level: number }[];
  prev?: { href: string; label: string; labelEn?: string };
  next?: { href: string; label: string; labelEn?: string };
}

export function DocsPage({
  children,
  tocItems = [],
  prev,
  next,
}: DocsPageProps) {
  return (
    <DocsLayout tocItems={tocItems}>
      <div className="space-y-6">
        {children}
        <DocsPageNav prev={prev} next={next} />
      </div>
    </DocsLayout>
  );
}
