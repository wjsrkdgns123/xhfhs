import { describe, it, expect } from 'vitest';
import { parseAiPick, stripVerdictTag, computeOutcome } from './verdict';

describe('parseAiPick (#26)', () => {
  it('parses pro / con / tie (대소문자·공백 허용)', () => {
    expect(parseAiPick('...분석... <verdict>pro</verdict>')).toEqual({ pick: 'pro', matched: true });
    expect(parseAiPick('x <verdict> CON </verdict>')).toEqual({ pick: 'con', matched: true });
    expect(parseAiPick('<verdict>tie</verdict>')).toEqual({ pick: 'tie', matched: true });
  });

  it('태그가 없으면 matched=false 로 표시(조용한 tie 폴백 구분)', () => {
    expect(parseAiPick('태그 없는 본문')).toEqual({ pick: 'tie', matched: false });
  });
});

describe('stripVerdictTag', () => {
  it('verdict 태그를 제거하고 trim', () => {
    expect(stripVerdictTag('마무리 코멘트입니다. <verdict>pro</verdict>')).toBe('마무리 코멘트입니다.');
  });
});

describe('computeOutcome (#33 50/50 합산)', () => {
  it('관전자 0명이면 AI 단독 판정', () => {
    expect(computeOutcome(0, 0, 'pro').winner).toBe('pro');
    expect(computeOutcome(0, 0, 'con').winner).toBe('con');
    expect(computeOutcome(0, 0, 'tie').winner).toBe('tie');
  });

  it('관전자·AI가 같은 쪽이면 그 쪽 승', () => {
    expect(computeOutcome(10, 0, 'pro').winner).toBe('pro');
    expect(computeOutcome(0, 10, 'con').winner).toBe('con');
  });

  it('관전자 100% pro + AI con → 정확히 0.5 → 무승부(epsilon)', () => {
    expect(computeOutcome(10, 0, 'con')).toMatchObject({ winner: 'tie', finalProScore: 50 });
  });

  it('관전자 5:5 + AI pro → 0.75 → pro, finalProScore 75', () => {
    expect(computeOutcome(5, 5, 'pro')).toMatchObject({ winner: 'pro', finalProScore: 75 });
  });

  it('finalProScore 는 0~100 정수', () => {
    expect(computeOutcome(3, 1, 'pro').finalProScore).toBe(88); // (0.75*0.5 + 1*0.5)=0.875
  });
});
