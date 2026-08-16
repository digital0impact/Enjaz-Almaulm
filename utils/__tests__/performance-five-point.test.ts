import {
  FIVE_POINT_RANGES,
  scoreToGrade,
  calculateOverallAverageFivePoint,
} from '../performance-five-point';

describe('scoreToGrade', () => {
  it('maps each documented range to its grade', () => {
    expect(scoreToGrade(100)).toBe(5);
    expect(scoreToGrade(90)).toBe(5);
    expect(scoreToGrade(89)).toBe(4);
    expect(scoreToGrade(80)).toBe(4);
    expect(scoreToGrade(79)).toBe(3);
    expect(scoreToGrade(70)).toBe(3);
    expect(scoreToGrade(69)).toBe(2);
    expect(scoreToGrade(60)).toBe(2);
    expect(scoreToGrade(59)).toBe(1);
    expect(scoreToGrade(0)).toBe(1);
  });

  it('clamps out-of-range scores instead of throwing', () => {
    expect(scoreToGrade(-20)).toBe(1);
    expect(scoreToGrade(150)).toBe(5);
  });

  it('stays consistent with FIVE_POINT_RANGES boundaries', () => {
    for (const range of FIVE_POINT_RANGES) {
      expect(scoreToGrade(range.min)).toBe(range.grade);
      expect(scoreToGrade(range.max)).toBe(range.grade);
    }
  });
});

describe('calculateOverallAverageFivePoint', () => {
  it('returns 0 for an empty or missing list', () => {
    expect(calculateOverallAverageFivePoint([])).toBe(0);
    expect(calculateOverallAverageFivePoint(undefined as unknown as [])).toBe(0);
  });

  it('computes sum(grade * weight) / 5, rounded', () => {
    // All items score 100 (grade 5), weights sum to 100 -> 5*100/5 = 100
    expect(
      calculateOverallAverageFivePoint([
        { score: 100, weight: 50 },
        { score: 100, weight: 50 },
      ])
    ).toBe(100);

    // Mixed grades: grade 5 (weight 60) + grade 1 (weight 40)
    // = (5*60 + 1*40) / 5 = (300 + 40) / 5 = 68
    expect(
      calculateOverallAverageFivePoint([
        { score: 95, weight: 60 },
        { score: 10, weight: 40 },
      ])
    ).toBe(68);
  });

  it('treats missing score/weight as 0', () => {
    expect(
      calculateOverallAverageFivePoint([
        { score: undefined as unknown as number, weight: 50 },
      ])
    ).toBe(10); // scoreToGrade(0) = 1 -> 1*50/5 = 10
  });
});
