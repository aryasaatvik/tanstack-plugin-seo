import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { AuditReport } from "./model";

const cell = (value: unknown): string =>
  String(value ?? "—")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");

export const renderAuditMarkdown = (report: AuditReport): string => {
  const structural = report.findings.filter(
    (finding) => finding.severity === "structural",
  );
  const editorial = report.findings.filter(
    (finding) => finding.severity === "editorial",
  );
  const lines = [
    "# SEO audit",
    "",
    `Generated: ${report.generatedAt}`,
    `Targets: ${report.targets.length} · Structural: ${structural.length} · Editorial: ${editorial.length}`,
    "",
    "## Scanner results",
    "",
    "| Scanner | Target | Status | Findings |",
    "| --- | --- | --- | ---: |",
    ...report.results.map(
      (result) =>
        `| ${cell(result.scanner)} | ${cell(result.target)} | ${cell(result.status)} | ${result.findings.length} |`,
    ),
  ];

  if (report.findings.length > 0) {
    lines.push(
      "",
      "## Findings",
      "",
      "| Severity | Rule | Target | Finding |",
      "| --- | --- | --- | --- |",
      ...report.findings.map(
        (finding) =>
          `| ${cell(finding.severity)} | ${cell(finding.rule)} | ${cell(finding.target)} | ${cell(finding.message)} |`,
      ),
    );
  }

  if (report.warnings.length > 0) {
    lines.push(
      "",
      "## Warnings",
      "",
      ...report.warnings.map((warning) => `- ${warning}`),
    );
  }

  return `${lines.join("\n")}\n`;
};

const atomicWrite = async (path: string, contents: string): Promise<void> => {
  const temporary = `${path}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, contents, "utf8");
  await rename(temporary, path);
};

export const writeAuditFiles = async (
  report: AuditReport,
  outputDirectory: string,
): Promise<{ readonly json: string; readonly markdown: string }> => {
  await mkdir(outputDirectory, { recursive: true });
  const stamp = report.generatedAt.replaceAll(":", "-");
  const json = join(outputDirectory, `${stamp}.json`);
  const markdown = join(outputDirectory, `${stamp}.md`);
  await Promise.all([
    atomicWrite(json, `${JSON.stringify(report, null, 2)}\n`),
    atomicWrite(markdown, renderAuditMarkdown(report)),
  ]);
  return { json, markdown };
};
