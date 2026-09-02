// test/xlsx-upload-bug-exploration.test.js
// Bug condition exploration property test for XLSX Drive upload retry logic.
// **Validates: Requirements 1.4**
//
// This test surfaces the bug on UNFIXED code by mocking uploadFileToGASDrive
// to fail on first attempt but succeed on retry. The test demonstrates that
// the unfixed code does NOT implement retry logic, does NOT save Drive link,
// and DOES use fallback API link instead.
//
// EXPECTED OUTCOME ON UNFIXED CODE: TEST FAILS
// - Counterexample: uploadFileToGASDrive failed once, system did not retry,
//   fallback API link was used instead, Link_XLSX NOT saved properly
//
// Run: npm test

/* eslint-disable @typescript-eslint/no-require-imports */

const test = require('node:test');
const assert = require('node:assert/strict');

// Mock tracking object to track uploadFileToGASDrive calls
const mockState = {
  callCount: 0,
  calls: [],
};

function resetMockState() {
  mockState.callCount = 0;
  mockState.calls = [];
}

/**
 * Mock uploadFileToGASDrive that fails on first attempt, succeeds on retry.
 * This simulates a transient network error (like a timeout).
 *
 * Returns a promise that:
 *   - Rejects with error on attempt 1
 *   - Resolves with Drive link on attempt 2+
 */
async function mockUploadFileToGASDrive_FailThenSucceed(params) {
  mockState.callCount++;
  mockState.calls.push({
    attempt: mockState.callCount,
    timestamp: new Date(),
    params: {
      fileName: params.fileName,
      mimeType: params.mimeType,
      bufferSize: params.buffer?.length || 0,
      folderId: params.folderId,
    },
  });

  if (mockState.callCount === 1) {
    // First attempt: fail with transient network error
    throw new Error('Network timeout');
  }

  // Second attempt onwards: succeed
  return {
    fileId: 'test-file-id-12345',
    webViewLink: 'https://drive.google.com/file/d/test-file-id-12345/view?usp=drivesdk',
    downloadUrl: 'https://drive.google.com/uc?id=test-file-id-12345&export=download',
  };
}

/**
 * Simulates the unfixed POST /api/so/[laporanId]/xlsx handler.
 * This is the buggy code that doesn't implement retry logic.
 *
 * Behavior on failure:
 *   - Catches upload error silently
 *   - Falls back to creating temporary API link
 *   - Does NOT retry the upload
 */
async function handleXlsxSubmit_Unfixed(params) {
  const {
    laporanId,
    uploadFileToGASDrive: uploadFn,
    updateLaporanXlsxLink: updateFn,
    folderId,
    fileName,
    buffer,
  } = params;

  let xlsxLink = '';
  let updateCalled = false;
  let updateCalledWith = null;

  try {
    // Single attempt - NO RETRY LOGIC
    const res = await uploadFn({
      folderId,
      fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });
    xlsxLink = res.webViewLink || res.downloadUrl;
  } catch (err) {
    // Bug: error is caught, no retry attempted, no propagation
    console.error('[XLSX] GAS upload gagal, fallback ke xlsx-file:', err);
    xlsxLink = '';
  }

  // Bug: fallback link is created when upload fails
  if (!xlsxLink) {
    const origin = 'http://localhost:3000';
    xlsxLink = `${origin}/api/so/${encodeURIComponent(laporanId)}/xlsx-file?cabang=test-cabang`;
  }

  // updateLaporanXlsxLink is called with fallback link (not Drive link)
  try {
    updateFn(laporanId, xlsxLink);
    updateCalled = true;
    updateCalledWith = xlsxLink;
  } catch {
    // non-critical
  }

  return {
    success: true,
    xlsxLink,
    uploadAttempts: mockState.callCount,
    updateCalled,
    updateCalledWith,
  };
}

test('Bug Condition Property 1: XLSX Upload Should Retry But Does Not on Unfixed Code', async () => {
  resetMockState();

  // Setup: Mock updateLaporanXlsxLink
  const mockUpdateLaporanXlsxLink = (laporanId, link) => {
    // No-op in mock
  };

  // Act: Call the unfixed XLSX submit handler with mock that fails then succeeds
  // This simulates a transient failure that SHOULD be retried
  const result = await handleXlsxSubmit_Unfixed({
    laporanId: 'RPT_20260829_ABC123',
    uploadFileToGASDrive: mockUploadFileToGASDrive_FailThenSucceed,
    updateLaporanXlsxLink: mockUpdateLaporanXlsxLink,
    folderId: 'test-folder-id',
    fileName: 'SO_20260829_Opening_Taufik.xlsx',
    buffer: Buffer.from('mock xlsx data'),
  });

  // EXPECTED PROPERTY (will FAIL on unfixed code):
  // After an upload fails, the system SHOULD retry and eventually save Drive link
  
  // This assertion FAILS on unfixed code (proving the bug):
  // - Unfixed code makes only 1 attempt (no retries)
  // - Expected: 2+ attempts when retry logic is implemented
  assert.equal(mockState.callCount, 2, 
    'Bug exposed: uploadFileToGASDrive called ' + mockState.callCount + ' times; expected 2 (1 fail + 1 retry)');

  // This assertion FAILS on unfixed code (proving the bug):
  // - Unfixed code saves fallback API link
  // - Expected: Drive link when retry logic is implemented
  assert.equal(result.xlsxLink.includes('drive.google.com'), true,
    'Bug exposed: xlsxLink is "' + result.xlsxLink + '"; expected to contain drive.google.com');

  // Counterexample documented on unfixed code:
  // uploadFileToGASDrive failed once, system did not retry, 
  // fallback link was used, Link_XLSX was NOT saved correctly
  console.log('✓ Bug condition property test completed');
});

test('Bug Condition Property 2: All SO Submissions Should Save Drive Links After Retry', async () => {
  // Property: For ALL SO submissions where Drive upload fails initially,
  // the system SHOULD retry and save Drive links.
  // This test FAILS on unfixed code because no retries occur.
  
  const testCases = [
    {
      laporanId: 'RPT_20260829_ABCD',
      fileName: 'SO_Opening_Cabang1.xlsx',
    },
    {
      laporanId: 'RPT_20260830_EFGH',
      fileName: 'SO_Closing_Cabang2.xlsx',
    },
    {
      laporanId: 'RPT_20260831_IJKL',
      fileName: 'SO_Opening_Cabang3.xlsx',
    },
  ];

  for (const testCase of testCases) {
    resetMockState();

    const result = await handleXlsxSubmit_Unfixed({
      laporanId: testCase.laporanId,
      uploadFileToGASDrive: mockUploadFileToGASDrive_FailThenSucceed,
      updateLaporanXlsxLink: (laporanId, link) => { /* no-op */ },
      folderId: 'test-folder-id',
      fileName: testCase.fileName,
      buffer: Buffer.from('mock xlsx data'),
    });

    // EXPECTED PROPERTY (will FAIL on unfixed code):
    // After transient failure, submission should have retried and saved Drive link
    assert.equal(mockState.callCount, 2,
      `${testCase.laporanId}: Bug exposed - only ${mockState.callCount} attempts; expected 2 (1 fail + 1 retry)`);
    
    assert.equal(result.xlsxLink.includes('drive.google.com'), true,
      `${testCase.laporanId}: Bug exposed - link is "${result.xlsxLink}"; expected Drive link`);
  }

  console.log('✓ Bug condition property test for multiple submissions completed');
});

test('Bug Condition: Verify Mock Can Succeed on Retry (for test validity)', async () => {
  // This test verifies that our mock WOULD succeed on retry,
  // proving that the bug is in the code, not in our test.
  resetMockState();

  // Attempt 1 should fail
  try {
    await mockUploadFileToGASDrive_FailThenSucceed({
      folderId: 'test-folder',
      fileName: 'test.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('data'),
    });
    assert.fail('First attempt should throw');
  } catch (err) {
    assert.equal(err.message, 'Network timeout', 'First attempt throws network error');
  }

  // Attempt 2 should succeed
  const result = await mockUploadFileToGASDrive_FailThenSucceed({
    folderId: 'test-folder',
    fileName: 'test.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('data'),
  });

  assert.equal(result.webViewLink.includes('drive.google.com'), true, 'Retry succeeds with Drive link');
  assert.equal(mockState.callCount, 2, 'Mock was called twice (1 fail + 1 success)');

  console.log('✓ Mock setup verified: Would succeed on retry if code implemented retry logic');
});
