# Handing a page over, and reading one from its link

## Hand it over

Give the user its path, as the `open-in-instrument` skill's link line when that skill is installed, and show the page in this environment's preview of local files if it has one.

If the reader can't open a file from where they are, or they asked for a link or to share, send or post the page, publish it yourself with `node <skill>/share.mjs page.html` (or `python <skill>/share.py page.html`); don't point them at the Share button instead. Never publish it with a host's own tool, such as a claude.ai Artifact, a canvas or a gist: the host blocks the page's scripts and Share button and keeps a copy `--delete` can't reach. The script puts a copy at its own unlisted address for thirty days and prints the link and a delete token, and `--delete` takes it down. It publishes nothing while the page holds a string shaped like an API key, token or private key, and names each by line: replace each with a placeholder or masked text, or, when none is a working secret, run it again with `--allow-secrets`.

Otherwise, including when they only say someone else will see it, offer it in one plain sentence ("Want me to put a private copy online? Only people you send the address to can open it, and it deletes itself in a month.") and wait for their answer. Never publish a page with the reader's private figures or names in it without asking first.

## Reading a wireframe from its link

A wireframe draws its frames with script, so its bytes hold the title and little else, and the link answers with what you can read instead. A fetch tool that asks for Markdown gets every frame's screen text, title and note, and after the screen text one line per mark, such as `(new mark: Convert)`, naming the mark and what it sits on. Fetched without asking for Markdown, as `curl <link>` does, the same address answers with the page as it was drawn: every frame's HTML and classes, with the scripts taken out. Read that HTML when you are building from a wireframe, since it is the layout itself. The Markdown keeps the words and drops how things look, so what is dimmed, disabled or the primary button, and where a link sits, is only in the HTML's classes; most of its bytes are the page's stylesheet, which you can skip. When you talk about a frame, give its number and title, so the reader can find it.
