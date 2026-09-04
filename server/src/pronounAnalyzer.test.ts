import { describe, expect, it } from "vitest";
import { analyzePronouns, FIRST_PERSON, THIRD_PERSON } from "./pronounAnalyzer";

describe("Pronoun Shift analyzer (JS fallback)", () => {
  it("handles empty and whitespace-only text with a null ratio", () => {
    for (const text of ["", "   ", "\n\t "]) {
      const r = analyzePronouns(text);
      expect(r.firstCount).toBe(0);
      expect(r.thirdCount).toBe(0);
      expect(r.firstPercent).toBe(0);
      expect(r.thirdPercent).toBe(0);
      expect(r.subjectiveRatio).toBeNull();
      expect(r.source).toBe("js-fallback");
    }
  });

  it("counts first-person pronouns across conjugations", () => {
    const r = analyzePronouns("I feel lost. We went together. My mind is mine.");
    expect(r.firstCount).toBe(4); // i, we, my, mine
    expect(r.thirdCount).toBe(0);
    expect(r.firstPercent).toBe(100);
    expect(r.subjectiveRatio).toBeNull();
  });

  it("counts third-person pronouns across genders and singular they", () => {
    const r = analyzePronouns(
      "They said he left his bag. She kept hers. It was theirs."
    );
    // they, he, his, she, hers, it, theirs
    expect(r.thirdCount).toBe(7);
    expect(r.firstCount).toBe(0);
  });

  it("is case-insensitive", () => {
    const r = analyzePronouns("I THINK THEY SAID MY NAME");
    expect(r.firstCount).toBe(2); // i, my
    expect(r.thirdCount).toBe(1); // they
  });

  it("reports percents and the first/third ratio on mixed text", () => {
    const r = analyzePronouns("I feel lost. You said we would handle it together.");
    // first: i, we = 2 ; third: it = 1
    expect(r.firstCount).toBe(2);
    expect(r.thirdCount).toBe(1);
    expect(r.firstPercent).toBe(66.67);
    expect(r.thirdPercent).toBe(33.33);
    expect(r.subjectiveRatio).toBe(2);
  });

  it("returns a null ratio when there are no third-person pronouns", () => {
    const r = analyzePronouns("I, me, my");
    expect(r.thirdCount).toBe(0);
    expect(r.subjectiveRatio).toBeNull();
  });

  it("computes exact fractional percentages without truncating", () => {
    const r = analyzePronouns("I I I they");
    expect(r.firstPercent).toBe(75);
    expect(r.thirdPercent).toBe(25);
    expect(r.subjectiveRatio).toBe(3);
  });

  it("reports the js-fallback source and tokenizer", () => {
    const r = analyzePronouns("It is what it is");
    expect(r.source).toBe("js-fallback");
    expect(r.tokenizer).toBe("regex");
  });

  it("lexicons contain the expected possessive and reflexive forms", () => {
    expect(FIRST_PERSON.has("ourselves")).toBe(true);
    expect(THIRD_PERSON.has("themself")).toBe(true);
    expect(THIRD_PERSON.has("themselves")).toBe(true);
    expect(THIRD_PERSON.has("himself")).toBe(true);
  });
});