/**
 * EjjiLink AI - Automated Classifier & Robustness Test Suite
 * Run with: npx tsx test/classifier.test.ts
 */

import { 
  classifyHandPoseDetailed, 
  normalizeLandmarks 
} from '../src/services/gestureClassifier';
import { TemporalStabilizer } from '../src/services/temporalStabilizer';
import { 
  evaluationService, 
  createSyntheticPose 
} from '../src/services/evaluationService';
import { GESTURE_LIST } from '../src/data/gestures';

console.log('====================================================');
console.log('  EJ JILINK AI — PHASE C AUTOMATED TEST SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`         Details: ${details}`);
  }
}

// 1. Normalization Tests
console.log('\n--- 1. Landmark Normalization Tests ---');
{
  const basePose = createSyntheticPose('hello');
  const normBase = normalizeLandmarks(basePose);

  // Translation test (+10, -5)
  const shifted = basePose.map((p) => ({ x: p.x + 10, y: p.y - 5, z: p.z }));
  const normShifted = normalizeLandmarks(shifted);

  let transDelta = 0;
  for (let i = 0; i < normBase.length; i++) {
    transDelta = Math.max(transDelta, Math.abs(normBase[i].x - normShifted[i].x));
  }
  assert(transDelta < 1e-4, 'Translation Invariance (dx=+10, dy=-5)', `Delta: ${transDelta}`);

  // Scale test (2.5x)
  const scaled = basePose.map((p, idx) =>
    idx === 0
      ? p
      : {
          x: basePose[0].x + (p.x - basePose[0].x) * 2.5,
          y: basePose[0].y + (p.y - basePose[0].y) * 2.5,
          z: p.z * 2.5,
        }
  );
  const normScaled = normalizeLandmarks(scaled);

  let scaleDelta = 0;
  for (let i = 0; i < normBase.length; i++) {
    scaleDelta = Math.max(scaleDelta, Math.abs(normBase[i].x - normScaled[i].x));
  }
  assert(scaleDelta < 1e-4, 'Scale Invariance (2.5x palm expansion)', `Delta: ${scaleDelta}`);
}

// 2. Malformed Landmark Handling Tests
console.log('\n--- 2. Malformed Landmark Robustness Tests ---');
{
  const resEmpty = classifyHandPoseDetailed([]);
  assert(resEmpty.isUnknown && resEmpty.predictedGesture === 'unknown', 'Empty landmark array safely yields Unknown');

  const resFew = classifyHandPoseDetailed([
    { x: 0.1, y: 0.2, z: 0 },
    { x: 0.3, y: 0.4, z: 0 },
  ]);
  assert(resFew.isUnknown && resFew.predictedGesture === 'unknown', 'Incomplete landmarks (< 21 points) yields Unknown');

  const nanPose = createSyntheticPose('peace');
  nanPose[8] = { x: NaN, y: NaN, z: NaN };
  const resNaN = classifyHandPoseDetailed(nanPose);
  assert(resNaN.isUnknown, 'NaN landmark coordinate does not throw and yields Unknown');
}

// 3. Ground-Truth Template Matching Coverage
console.log('\n--- 3. 12-Gesture Synthetic Template Matching ---');
{
  for (const gesture of GESTURE_LIST) {
    const pose = createSyntheticPose(gesture.id);
    const result = classifyHandPoseDetailed(pose);
    assert(
      result.predictedGesture === gesture.id && result.confidence >= 0.85,
      `Gesture "${gesture.id}" (${gesture.labelEn}) canonical match`,
      `Predicted: ${result.predictedGesture}, Confidence: ${result.confidence}`
    );
  }
}

// 4. Unknown Distractor Rejection Tests
console.log('\n--- 4. Negative Distractor Rejection Tests ---');
{
  const distractor = createSyntheticPose('unknown_distractor');
  const res = classifyHandPoseDetailed(distractor);
  assert(res.isUnknown && res.predictedGesture === 'unknown', 'Non-vocabulary distractor pose rejected as Unknown', `Predicted: ${res.predictedGesture}`);
}

// 5. Temporal Stabilizer & Debounce Tests
console.log('\n--- 5. Temporal Stabilizer & Debounce Tests ---');
{
  const stabilizer = new TemporalStabilizer({ windowSize: 6, lockThreshold: 0.82, requiredConsecutive: 5 });

  // Test Jitter rejection
  stabilizer.update('hello', 0.90);
  stabilizer.update('hello', 0.90);
  stabilizer.update('water', 0.90);
  const outJitter = stabilizer.update('peace', 0.90);
  assert(!outJitter.isLocked, 'Rapid switching / jitter between different gestures rejected');

  // Test sustained sign lock
  stabilizer.reset();
  let lockedAfter5 = false;
  for (let i = 1; i <= 5; i++) {
    const out = stabilizer.update('water', 0.92);
    if (i < 5) {
      assert(!out.isLocked, `Frame ${i}/5: Should not lock yet`);
    } else {
      lockedAfter5 = out.isLocked && out.lockedGesture === 'water';
    }
  }
  assert(lockedAfter5, 'Frame 5/5: Sustained sign locks with high confidence');
}

// 6. Evaluation Metrics Engine Verification
console.log('\n--- 6. Evaluation Metrics Engine Verification ---');
{
  const records = evaluationService.generateBenchmarkEvaluationRecords();
  const report = evaluationService.evaluateSamples(records);

  assert(report.evaluatedSampleCount === records.length, `Metrics computed for all ${records.length} samples`);
  assert(report.overallAccuracy >= 90, `Overall Benchmark Accuracy is >= 90% (Actual: ${report.overallAccuracy}%)`);
  assert(report.confusionMatrix.matrix.length === report.confusionMatrix.labels.length, 'Confusion matrix dimension matches label count');
  assert(report.medianLatencyMs >= 0 && report.p95LatencyMs >= report.medianLatencyMs, `Latency percentiles valid (Median: ${report.medianLatencyMs}ms, p95: ${report.p95LatencyMs}ms)`);
  assert(report.auditDisclosures.hasTrainedModel === false, 'Scientific honesty disclosure verifies no unverified trained model claimed');
}

console.log('\n====================================================');
console.log(`  RESULTS: ${passedTests} passed, ${failedTests} failed, ${totalTests} total.`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
