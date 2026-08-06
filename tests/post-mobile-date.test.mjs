import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const postPage = readFileSync(
  new URL("../pages/posts/[slug].tsx", import.meta.url),
  "utf8",
);

test("post date remains visible below the desktop sidebar breakpoint", () => {
  const mobileDate = postPage.match(
    /<div className="post-date-mobile[^\"]*xl:hidden[^\"]*">([\s\S]*?)<\/div>/,
  );

  assert.ok(mobileDate, "expected a mobile-only post date container");
  assert.match(mobileDate[1], /<time[^>]*dateTime=\{date\}/);
  assert.match(mobileDate[1], /\{formatDate\(date, false\)\}/);
});
