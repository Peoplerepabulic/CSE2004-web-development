/* Local-only audit UI. Served by preview.py, never shipped in dist. */
const panel = document.createElement("aside");
panel.id = "qa-audit";
panel.setAttribute("aria-label", "Local accessibility audit");
panel.style.cssText =
  "position:fixed;bottom:8px;left:8px;z-index:20000;background:#fffdf5;color:#1e2b22;padding:12px;border:1px solid #2f4a32;max-width:90vw;max-height:45vh;overflow:auto";
const run = document.createElement("button");
run.type = "button";
run.textContent = "Run accessibility check";
const output = document.createElement("pre");
output.id = "qa-results";
output.style.whiteSpace = "pre-wrap";
output.style.fontSize = "12px";
panel.append(run, output);
document.body.append(panel);
run.addEventListener("click", async () => {
  run.disabled = true;
  output.textContent = "Checking…";
  try {
    const result = await axe.run(document, {
      exclude: [["#qa-audit"]],
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
    });
    output.textContent = JSON.stringify(
      {
        violations: result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        incomplete: result.incomplete.map((v) => v.id),
        passes: result.passes.length,
      },
      null,
      2,
    );
  } catch (error) {
    output.textContent = String(error);
  }
  run.disabled = false;
});
