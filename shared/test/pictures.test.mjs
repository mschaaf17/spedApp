import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pictureFor, SUPPORT_PICTURES } from "../pictures.mjs";
test("every student picture has a bundled app and extension illustration", async () => {
  for (const [key] of SUPPORT_PICTURES) {
    assert.match(
      await readFile(
        new URL(`../../mobile/public/pictures/${key}.svg`, import.meta.url),
        "utf8",
      ),
      /<svg/,
    );
    assert.match(
      await readFile(
        new URL(`../../extension/pictures/${key}.svg`, import.meta.url),
        "utf8",
      ),
      /<svg/,
    );
  }
});
test("educator picture selection overrides keyword suggestions and prevents arbitrary asset paths", () => {
  assert.equal(
    pictureFor({ title: "Reading aloud", picture: "directions" }),
    "directions",
  );
  assert.equal(pictureFor({ title: "Minimized distraction" }), "quiet");
  assert.equal(pictureFor({ title: "Unknown custom accommodation" }), "help");
  assert.equal(pictureFor({ picture: "../../unsafe-path" }), "help");
});
