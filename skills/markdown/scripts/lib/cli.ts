import { cac } from "cac";

export function createHtmlToMarkdownCli() {
  const cli = cac("html-to-md");
  cli.usage("--html-file page.html --output page.md");
  cli.option("--html-file <path>", "Input HTML file path");
  cli.option("--html <htmlString>", "Inline HTML string input");
  cli.option("--output <path>", "Output Markdown file path");
  cli.option("--no-gfm", "Disable GitHub-Flavored Markdown");
  cli.option("--heading-style <style>", "Heading style: atx or setext", {
    default: "atx",
  });
  cli.option(
    "--code-block-style <style>",
    "Code block style: fenced or indented",
    { default: "fenced" },
  );
  cli.help();
  return cli;
}
