import { TestResult, TestContext } from '@jest/types';

class TabularReporter {
  private results: Array<{
    suite: string;
    test: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
  }> = [];

  private startTime: number = 0;

  onRunStart() {
    this.startTime = Date.now();
    console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                        NEYOFIT E2E TEST SUITE                                 ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log('║  Suite                          │ Test                                     │ Status  │ Time   ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  }

  onTestStart(test: TestContext) {
    // Track start time per test
  }

  onTestResult(test: TestContext, result: TestResult) {
    const duration = Date.now() - this.startTime;
    const status = result.status === 'passed' ? 'passed' : result.status === 'failed' ? 'failed' : 'skipped';
    
    const suiteName = test.title.split(' › ')[0] || 'Unknown';
    const testName = test.title.split(' › ').slice(1).join(' › ') || test.title;
    
    this.results.push({
      suite: suiteName,
      test: testName,
      status,
      duration,
      error: result.failureMessages?.[0],
    });

    const statusIcon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
    const statusText = status === 'passed' ? 'PASS' : status === 'failed' ? 'FAIL' : 'SKIP';
    
    const suiteDisplay = this.truncate(suiteName, 34);
    const testDisplay = this.truncate(testName, 40);
    const timeDisplay = `${duration}ms`.padStart(6);

    console.log(`║ ${suiteDisplay.padEnd(34)} │ ${testDisplay.padEnd(40)} │ ${statusIcon} ${statusText} │ ${timeDisplay} ║`);
  }

  onRunComplete() {
    const totalTime = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const total = this.results.length;

    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  SUMMARY: ${total} tests | ${passed} passed | ${failed} failed | ${skipped} skipped | ${totalTime}ms total                                    ║`);
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

    if (failed > 0) {
      console.log('❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => {
          console.log(`   ${r.suite} › ${r.test}`);
          if (r.error) {
            const errorLines = r.error.split('\n').slice(0, 3);
            errorLines.forEach(line => console.log(`      ${line.trim()}`));
          }
        });
      console.log('');
    }

    if (failed > 0) {
      process.exitCode = 1;
    }
  }

  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
  }
}

export default TabularReporter;