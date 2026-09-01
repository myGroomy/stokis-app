// app/api/debug/test-drive/route.ts
// Test upload ke Drive — hapus setelah selesai debug
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getDriveClient } from '@/lib/google/client';

export const GET = withAuth(async (req: NextRequest) => {
  const folderId = req.nextUrl?.searchParams.get('folderId') || '11y0RsUku9UBcXeT253bv87_aWfmo0-81';
  const drive = getDriveClient();

  const results: Record<string, unknown> = {};

  // Test 1: List files di folder
  try {
    const listRes = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id,name,mimeType)',
      pageSize: 5,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    results.listFiles = listRes.data.files;
  } catch (err) {
    results.listFilesError = err instanceof Error ? err.message : String(err);
  }

  // Test 2: Upload file test kecil
  try {
    const { PassThrough } = await import('stream');
    const bodyStream = new PassThrough();
    bodyStream.end(Buffer.from('test content'));

    const createRes = await drive.files.create({
      requestBody: {
        name: 'test-upload-delete-me.txt',
        mimeType: 'text/plain',
        parents: [folderId],
      },
      media: {
        mimeType: 'text/plain',
        body: bodyStream,
      },
      fields: 'id,webViewLink',
      supportsAllDrives: true,
    });

    results.uploadFileId = createRes.data.id;
    results.uploadLink = createRes.data.webViewLink;

    // Set permission
    if (createRes.data.id) {
      await drive.permissions.create({
        fileId: createRes.data.id,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true,
      });
      results.permissionSet = true;
    }

    // Hapus file test
    if (createRes.data.id) {
      await drive.files.delete({ fileId: createRes.data.id, supportsAllDrives: true });
      results.deleted = true;
    }
  } catch (err) {
    results.uploadError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(results);
});
