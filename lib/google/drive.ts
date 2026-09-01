// lib/google/drive.ts
// Operasi Google Drive API v3 — pengganti DriveApp di Google Apps Script.

import { getDriveClient } from './client';

/**
 * Upload buffer PDF ke folder Drive tertentu dan ambil link untuk akses view/download.
 * Memakai scope drive.file (jadi folder harus sudah di-share ke service account).
 * @returns webViewLink yang bisa dibuka user.
 */
export async function uploadPdfToDrive(
  folderId: string,
  fileName: string,
  buffer: Buffer
): Promise<{ fileId: string; webViewLink: string; downloadUrl: string }> {
  const drive = getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: 'application/pdf',
      parents: [folderId],
    },
    media: {
      mimeType: 'application/pdf',
      body: buffer,
    },
    fields: 'id,webViewLink,name',
  });

  const fileId = res.data.id;
  if (!fileId) throw new Error('Gagal membuat file di Google Drive (fileId kosong)');
  const webViewLink = res.data.webViewLink || '';
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  // Buka akses "siapa saja dengan link dapat melihat" agar link bisa dibagikan
  // lewat WhatsApp/e-mail. Best-effort — jika gagal, link tetap tersimpan.
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });
  } catch {
    // abaikan; file tetap di Drive namun hanya bisa diakses akun yang berhak
  }

  return { fileId, webViewLink, downloadUrl };
}
