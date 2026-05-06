import fs from 'fs';
import os from 'os';
import path from 'path';
import vm from 'vm';
import { spawn } from 'child_process';
import { ExerciseRestriction, ExerciseTest } from './manifestService';

interface RunExerciseInput {
  code: string;
  language: string;
  tests: ExerciseTest[];
  restrictions?: ExerciseRestriction[];
  applyRestrictions?: boolean;
}

export interface TestResult {
  name: string;
  passed: boolean;
  input: unknown[];
  expected: unknown;
  received?: unknown;
  error?: string;
}

interface RunExerciseResult {
  passed: boolean;
  results: TestResult[];
  output: string;
}

const isEqual = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

const normalizeLanguage = (language: string) => language.toLowerCase().replace(/\s+/g, '');

const checkRestrictions = (code: string, restrictions: ExerciseRestriction[] = []): TestResult[] => (
  restrictions
    .filter((restriction) => {
      if (restriction.type !== 'forbiddenSource') return false;
      if (restriction.value === 'len(') return /(^|[^A-Za-z0-9_])len\s*\(/.test(code);
      return code.includes(restriction.value);
    })
    .map((restriction) => ({
      name: 'Source restriction',
      passed: false,
      input: [],
      expected: `Source must not contain ${restriction.value}`,
      error: restriction.message,
    }))
);

const runJavaScriptTests = ({ code, tests }: RunExerciseInput): RunExerciseResult => {
  const context = vm.createContext({});
  vm.runInContext(code, context, { timeout: 1500 });

  const results = tests.map((test) => {
    try {
      const candidate = context[test.functionName];
      if (typeof candidate !== 'function') {
        return {
          name: test.name,
          passed: false,
          input: test.args,
          expected: test.expected,
          error: `Missing function ${test.functionName}`,
        };
      }

      const received = candidate(...test.args);
      return {
        name: test.name,
        passed: isEqual(received, test.expected),
        input: test.args,
        expected: test.expected,
        received,
      };
    } catch (error: any) {
      return {
        name: test.name,
        passed: false,
        input: test.args,
        expected: test.expected,
        error: error.message,
      };
    }
  });

  return {
    passed: results.every((result) => result.passed),
    results,
    output: results.map((result) => `${result.passed ? 'PASS' : 'FAIL'} ${result.name}`).join('\n'),
  };
};

const pythonHarness = `
import json
import traceback

tests = json.loads(r'''__TESTS__''')
results = []

for test in tests:
    try:
        candidate = globals().get(test["functionName"])
        if not callable(candidate):
            raise Exception(f'Missing function {test["functionName"]}')
        received = candidate(*test["args"])
        passed = received == test["expected"]
        results.append({
            "name": test["name"],
            "passed": passed,
            "input": test["args"],
            "expected": test["expected"],
            "received": received
        })
    except Exception as error:
        results.append({
            "name": test["name"],
            "passed": False,
            "input": test["args"],
            "expected": test["expected"],
            "error": str(error),
            "trace": traceback.format_exc(limit=1)
        })

print(json.dumps(results))
`;

const runPythonTests = ({ code, tests }: RunExerciseInput): Promise<RunExerciseResult> => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lms-run-'));
  const filePath = path.join(tempDir, 'solution.py');
  const harness = pythonHarness.replace('__TESTS__', JSON.stringify(tests).replace(/'''/g, "\\'\\'\\'"));
  fs.writeFileSync(filePath, `${code}\n\n${harness}`, 'utf8');

  return new Promise((resolve) => {
    const child = spawn(process.platform === 'win32' ? 'python' : 'python3', [filePath], { windowsHide: true });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill(), 5000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      fs.rmSync(tempDir, { recursive: true, force: true });
      resolve({
        passed: false,
        results: tests.map((test) => ({
          name: test.name,
          passed: false,
          input: test.args,
          expected: test.expected,
          error: `Python runner could not start: ${error.message}`,
        })),
        output: `Python runner could not start: ${error.message}`,
      });
    });

    child.on('close', () => {
      clearTimeout(timer);
      fs.rmSync(tempDir, { recursive: true, force: true });

      try {
        const parsed = JSON.parse(stdout.trim().split(/\r?\n/).pop() || '[]') as TestResult[];
        resolve({
          passed: parsed.every((result) => result.passed),
          results: parsed,
          output: parsed.map((result) => `${result.passed ? 'PASS' : 'FAIL'} ${result.name}`).join('\n'),
        });
      } catch {
        resolve({
          passed: false,
          results: tests.map((test) => ({
            name: test.name,
            passed: false,
            input: test.args,
            expected: test.expected,
            error: stderr || stdout || 'The code could not be executed.',
          })),
          output: stderr || stdout || 'The code could not be executed.',
        });
      }
    });
  });
};

export const exerciseRunnerService = {
  run: async (input: RunExerciseInput): Promise<RunExerciseResult> => {
    const restrictionFailures = input.applyRestrictions ? checkRestrictions(input.code, input.restrictions) : [];
    if (restrictionFailures.length) {
      return {
        passed: false,
        results: restrictionFailures,
        output: restrictionFailures.map((failure) => `FAIL ${failure.error}`).join('\n'),
      };
    }

    if (!input.tests.length) {
      return { passed: false, results: [], output: 'No tests are configured for this exercise yet.' };
    }

    const language = normalizeLanguage(input.language);
    if (language === 'python' || language === 'python3') {
      return runPythonTests(input);
    }

    return {
      passed: false,
      results: input.tests.map((test) => ({
        name: test.name,
        passed: false,
        input: test.args,
        expected: test.expected,
        error: 'This quest is currently graded in Python.',
      })),
      output: 'This quest is currently graded in Python.',
    };
  },
};
